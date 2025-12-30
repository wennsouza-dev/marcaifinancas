import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
// import Layout from '../components/Layout'; // Removed to avoid double layout
import Tesseract from 'tesseract.js';
import { Link } from 'react-router-dom';

interface ImportedTransaction {
    id: string; // temp id
    date: string;
    description: string;
    amount: string;
    type: 'expense' | 'income';
    category: string;
    selected: boolean;
    installments: number; // 1 = à vista
}

const SmartImport: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processMatch = (dateRaw: string, amountRaw: string, originalText: string, list: ImportedTransaction[]) => {
        let dateStr = dateRaw;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts[2].length === 2) parts[2] = '20' + parts[2];
            dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        let desc = originalText
            .replace(dateRaw, '')
            .replace(amountRaw, '')
            .replace('R$', '')
            .replace(/BRADESCO\s*CARTOES:?/gi, '')
            .replace(/COMPRA\s*APROVADA\s*(NO)?/gi, '')
            .replace(/VALOR\s*DE/gi, '')
            .replace(/CARTAO\s*FINAL\s*\d+/gi, '')
            .replace(/[^\w\s\u00C0-\u00FF]/g, ' ')
            .trim();

        desc = desc.replace(/\s+/g, ' '); // normalize spaces
        if (desc.length > 50) desc = desc.substring(0, 50).trim();
        if (desc.length === 0) desc = "Item Importado";

        // Avoid duplicates in the existing list
        const isDuplicate = list.some(i => i.date === dateStr && i.amount === amountRaw && i.description === desc);
        if (!isDuplicate) {
            list.push({
                id: crypto.randomUUID(),
                date: dateStr,
                description: desc,
                amount: amountRaw,
                type: 'expense',
                category: 'Outros',
                selected: true,
                installments: 1
            });
        }
    };

    const processImage = async (file: File) => {
        setProcessing(true);
        setProgress(0);
        setTransactions([]);

        try {
            const result = await Tesseract.recognize(file, 'por', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });

            // @ts-ignore
            const lines = result.data.lines;
            const extracted: ImportedTransaction[] = [];

            const dateRegex = /(\d{2}\/\d{2}\/\d{2,4})|(\d{4}-\d{2}-\d{2})/;
            const valueRegex = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/;

            // Robust parsing: handle missing lines
            const fullText = result.data.text || '';
            const textLines = (lines && Array.isArray(lines))
                ? lines.map((l: any) => l.text)
                : fullText.split('\n');

            // Strategy 1: Line-by-line (Strict)
            textLines.forEach((rawText: string) => {
                const text = rawText.trim();
                const dateMatch = text.match(dateRegex);
                const valueMatch = text.match(valueRegex);

                if (dateMatch && valueMatch) {
                    processMatch(dateMatch[0], valueMatch[1], text, extracted);
                }
            });

            // Strategy 2: Global Scan (Multi-line / SMS)
            // Finds Date ... (up to 100 chars) ... Value
            if (extracted.length === 0) {
                const globalRegex = /(\d{2}\/\d{2}\/\d{2,4})[\s\S]{0,100}?(?:R\$\s*)(\d{1,3}(?:\.\d{3})*,\d{2})/g;
                let match;
                while ((match = globalRegex.exec(fullText)) !== null) {
                    const dateStr = match[1];
                    const valueStr = match[2];
                    // Avoid duplicates if Strategy 1 already caught it (unlikely if we are here, but good practice)
                    // Construct a description from the context
                    const contextStart = Math.max(0, match.index);
                    const contextEnd = Math.min(fullText.length, match.index + match[0].length + 20);
                    const context = fullText.substring(contextStart, contextEnd).replace(/\n/g, ' ');

                    processMatch(dateStr, valueStr, context, extracted);
                }
            }

            // Deduplicate by ID isn't possible as they are new, but we can filter by content similarity if needed.
            // For now, accept all matches. Use a Map to simple dedup based on Date+Value+Desc?
            // Let's rely on the user to review.

            const limited = extracted.slice(0, 200);
            setTransactions(limited);

            if (limited.length === 0) {
                alert("Nenhuma transação identificada com clareza. Tente uma imagem mais nítida.");
            }

        } catch (err: any) {
            alert('Erro ao processar: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const updateTransaction = (id: string, field: keyof ImportedTransaction, value: any) => {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleImport = async () => {
        if (!user) return;
        const selected = transactions.filter(t => t.selected);
        if (selected.length === 0) return alert("Selecione pelo menos uma transação.");

        setLoading(true);
        try {
            const toInsert = [];

            for (const t of selected) {
                const numericAmount = parseFloat(t.amount.replace(/\./g, '').replace(',', '.'));

                const baseDate = new Date(t.date + 'T00:00:00');

                if (t.installments > 1) {
                    const groupId = crypto.randomUUID();
                    for (let i = 0; i < t.installments; i++) {
                        const installmentDate = new Date(baseDate);
                        installmentDate.setMonth(baseDate.getMonth() + i);
                        toInsert.push({
                            user_id: user.id,
                            description: `${t.description} (${i + 1}/${t.installments})`,
                            amount: numericAmount,
                            date: installmentDate.toISOString().split('T')[0],
                            category: t.category,
                            type: t.type,
                            group_id: groupId,
                            installment_number: i + 1,
                            total_installments: t.installments
                        });
                    }
                } else {
                    toInsert.push({
                        user_id: user.id,
                        description: t.description,
                        amount: numericAmount,
                        date: t.date,
                        category: t.category,
                        type: t.type
                    });
                }
            }

            const { error } = await supabase.from('transactions').insert(toInsert);
            if (error) throw error;

            alert(`${toInsert.length} transações importadas com sucesso!`);
            setTransactions([]);
        } catch (error: any) {
            alert('Erro ao importar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Importação Inteligente</h1>
                    <p className="text-sm text-gray-500">Transforme fotos de faturas e extratos em lançamentos (Beta)</p>
                </div>
                <Link to="/transactions" className="text-sm text-primary hover:underline">Voltar para Transações</Link>
            </div>

            {/* Upload Area */}
            {transactions.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-gray-50 hover:bg-white transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0])}
                    />

                    {processing ? (
                        <div className="flex flex-col items-center gap-4">
                            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                            <div className="space-y-1">
                                <p className="font-bold text-gray-900">Analisando imagem...</p>
                                <p className="text-sm text-gray-500">{progress}% concluído</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                            </div>
                            <div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all transform hover:scale-105"
                                >
                                    Selecionar Imagem (Fatura/Extrato)
                                </button>
                                <p className="mt-2 text-xs text-gray-400">Suporta JPG, PNG. Recomendado: fundo claro, texto nítido.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Results Editor */}
            {transactions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">list</span>
                            Itens Identificados ({transactions.filter(t => t.selected).length})
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTransactions([])}
                                className="text-gray-500 hover:text-red-500 text-sm font-medium px-3 py-2"
                            >
                                Descartar Tudo
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={loading}
                                className="bg-primary hover:bg-primary-hover text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                {loading ? 'Salvando...' : 'Confirmar Importação'}
                                <span className="material-symbols-outlined text-sm">check</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="p-3 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={transactions.every(t => t.selected)}
                                            onChange={(e) => {
                                                const val = e.target.checked;
                                                setTransactions(prev => prev.map(t => ({ ...t, selected: val })));
                                            }}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </th>
                                    <th className="p-3">Data</th>
                                    <th className="p-3">Descrição</th>
                                    <th className="p-3">Valor (R$)</th>
                                    <th className="p-3">Categoria</th>
                                    <th className="p-3">Tipo</th>
                                    <th className="p-3 text-center">Parcelas</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.map((t) => (
                                    <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${!t.selected ? 'opacity-50' : ''}`}>
                                        <td className="p-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={t.selected}
                                                onChange={(e) => updateTransaction(t.id, 'selected', e.target.checked)}
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="date"
                                                value={t.date}
                                                onChange={(e) => updateTransaction(t.id, 'date', e.target.value)}
                                                className="w-32 bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="text"
                                                value={t.description}
                                                onChange={(e) => updateTransaction(t.id, 'description', e.target.value)}
                                                className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="text"
                                                value={t.amount}
                                                onChange={(e) => updateTransaction(t.id, 'amount', e.target.value)}
                                                className="w-24 bg-transparent border-b border-transparent focus:border-primary focus:outline-none font-medium"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <select
                                                value={t.category}
                                                onChange={(e) => updateTransaction(t.id, 'category', e.target.value)}
                                                className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none text-xs"
                                            >
                                                <option>Alimentação</option>
                                                <option>Transporte</option>
                                                <option>Lazer</option>
                                                <option>Moradia</option>
                                                <option>Eletrônicos</option>
                                                <option>Saúde</option>
                                                <option>Outros</option>
                                                <option>Salário</option>
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <select
                                                value={t.type}
                                                onChange={(e) => updateTransaction(t.id, 'type', e.target.value)}
                                                className={`bg-transparent border-b border-transparent focus:border-primary focus:outline-none text-xs font-bold ${t.type === 'expense' ? 'text-expense' : 'text-primary'}`}
                                            >
                                                <option value="expense">Despesa</option>
                                                <option value="income">Receita</option>
                                            </select>
                                        </td>
                                        <td className="p-3 text-center">
                                            <input
                                                type="number"
                                                min="1"
                                                max="48"
                                                value={t.installments}
                                                onChange={(e) => updateTransaction(t.id, 'installments', parseInt(e.target.value) || 1)}
                                                className="w-12 text-center bg-gray-50 border border-gray-200 rounded text-xs"
                                            />
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => setTransactions(prev => prev.filter(x => x.id !== t.id))}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartImport;
