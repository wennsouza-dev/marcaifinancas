import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Eletrônicos', 'Saúde', 'Educação', 'Salário', 'Freelance', 'Outros'];
const PAYMENT_METHODS = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência', 'Dinheiro'];

interface Recurring {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    payment_method: string;
    day_of_month: number;
    active: boolean;
    last_generated_month: number | null;
    last_generated_year: number | null;
}

const RecurringTransactions: React.FC = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<Recurring[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genMsg, setGenMsg] = useState('');
    const [form, setForm] = useState({
        description: '', amount: '', type: 'expense' as 'income' | 'expense',
        category: 'Alimentação', payment_method: 'PIX', day_of_month: '5',
    });

    const fetch = async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase.from('recurring_transactions').select('*').eq('user_id', user.id).order('day_of_month');
        setItems(data || []);
        setLoading(false);
    };

    useEffect(() => { fetch(); }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        await supabase.from('recurring_transactions').insert({
            user_id: user.id,
            description: form.description,
            amount: parseFloat(form.amount.replace(',', '.')),
            type: form.type,
            category: form.category,
            payment_method: form.payment_method,
            day_of_month: parseInt(form.day_of_month),
        });
        setShowForm(false);
        setForm({ description: '', amount: '', type: 'expense', category: 'Alimentação', payment_method: 'PIX', day_of_month: '5' });
        fetch();
    };

    const handleToggle = async (item: Recurring) => {
        await supabase.from('recurring_transactions').update({ active: !item.active }).eq('id', item.id);
        fetch();
    };

    const handleDelete = async (id: string) => {
        await supabase.from('recurring_transactions').delete().eq('id', id);
        fetch();
    };

    const generateNow = async () => {
        if (!user || generating) return;
        setGenerating(true);
        setGenMsg('');
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const active = items.filter(i => i.active && (i.last_generated_month !== month || i.last_generated_year !== year));
        let count = 0;
        for (const item of active) {
            const day = Math.min(item.day_of_month, new Date(year, month + 1, 0).getDate());
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const { error } = await supabase.from('transactions').insert({
                user_id: user.id, description: item.description, amount: item.amount,
                type: item.type, category: item.category, payment_method: item.payment_method, date: dateStr,
            });
            if (!error) {
                await supabase.from('recurring_transactions').update({ last_generated_month: month, last_generated_year: year }).eq('id', item.id);
                count++;
            }
        }
        setGenMsg(count > 0 ? `✅ ${count} transação(ões) lançada(s) com sucesso!` : '⚠️ Nenhuma transação nova a gerar este mês.');
        setGenerating(false);
        fetch();
    };

    const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const now = new Date();

    return (
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-text-main dark:text-white">Transações Fixas</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Automatize lançamentos mensais recorrentes</p>
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span> Nova
                </button>
            </div>

            {/* Generate Button */}
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3 border border-indigo-100 dark:border-indigo-500/20">
                <div>
                    <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Lançar para {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</p>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400">Gera automaticamente todas as fixas ativas não lançadas este mês</p>
                </div>
                <button
                    onClick={generateNow}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                    <span className={`material-symbols-outlined text-[16px] ${generating ? 'animate-spin' : ''}`}>
                        {generating ? 'progress_activity' : 'play_arrow'}
                    </span>
                    {generating ? 'Lançando...' : 'Lançar Agora'}
                </button>
            </div>
            {genMsg && <p className="text-sm text-center mb-4 font-medium text-gray-600 dark:text-gray-300">{genMsg}</p>}

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-5 mb-6 space-y-4">
                    <h3 className="text-base font-bold text-text-main dark:text-white">Nova Transação Fixa</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Descrição</label>
                            <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Aluguel" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Tipo</label>
                            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none dark:text-white">
                                <option value="expense">Despesa</option>
                                <option value="income">Receita</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Valor (R$)</label>
                            <input required type="text" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Categoria</label>
                            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none dark:text-white">
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Dia do Mês</label>
                            <input type="number" min="1" max="31" value={form.day_of_month} onChange={e => setForm(f => ({ ...f, day_of_month: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors">Salvar</button>
                    </div>
                </form>
            )}

            {/* List */}
            {loading ? (
                <div className="text-center py-16 text-gray-400">Carregando...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <span className="material-symbols-outlined text-5xl opacity-20 block mb-3">repeat</span>
                    <p className="text-sm">Nenhuma transação fixa cadastrada.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <div key={item.id} className={`bg-white dark:bg-surface-dark rounded-2xl border ${item.active ? 'border-gray-100 dark:border-white/10' : 'border-dashed border-gray-200 dark:border-white/5 opacity-60'} shadow-sm p-4 flex items-center justify-between gap-3`}>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                    <span className={`material-symbols-outlined text-[18px] ${item.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {item.type === 'income' ? 'arrow_upward' : 'arrow_downward'}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-text-main dark:text-white truncate">{item.description}</p>
                                    <p className="text-xs text-gray-400">Todo dia {item.day_of_month} · {item.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {item.type === 'income' ? '+' : '-'} R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <button onClick={() => handleToggle(item)} title={item.active ? 'Pausar' : 'Ativar'} className="text-gray-300 hover:text-indigo-500 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">{item.active ? 'pause_circle' : 'play_circle'}</span>
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecurringTransactions;
