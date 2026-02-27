import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseSplitTransactionFromAudio } from '../services/geminiService';

interface NewSplitModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const NewSplitModal: React.FC<NewSplitModalProps> = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [friends, setFriends] = useState<any[]>([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedFriends, setSelectedFriends] = useState<{ id?: string, name: string, email?: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // New Fields
    const [splitType, setSplitType] = useState<'half' | 'full'>('half');
    const [isInstallment, setIsInstallment] = useState(false);
    // const [installmentsCount, setInstallmentsCount] = useState('1'); // Removed in favor of explicitly controlled inputs
    const [currentInstallment, setCurrentInstallment] = useState(1);
    const [remainingInstallments, setRemainingInstallments] = useState(0);
    const [isNextInvoice, setIsNextInvoice] = useState(false);

    const [processingAudio, setProcessingAudio] = useState(false);

    const handleAudioResult = async (text: string) => {
        if (!text.trim()) return;
        setProcessingAudio(true);
        try {
            console.log('Split Audio Result Start - Received text:', text);
            const parsed = await parseSplitTransactionFromAudio(text);
            console.log('Split Audio Result Parsed:', parsed);

            if (parsed) {
                setDescription(parsed.description);
                setAmount(parsed.amount.toString());
                setSplitType(parsed.splitType);

                // Reconstruct selected friends based on names
                if (parsed.friends && parsed.friends.length > 0) {
                    const newSelectedFriends = parsed.friends.map(friendName => {
                        // Try to find an exact match or clear substring match in existing friends
                        const existingFriend = friends.find(f => f.name.toLowerCase() === friendName.toLowerCase() || f.name.toLowerCase().includes(friendName.toLowerCase()));
                        if (existingFriend) {
                            return { id: existingFriend.id, name: existingFriend.name };
                        }
                        return { name: friendName }; // New friend
                    });

                    // Filter out exact duplicates
                    const uniqueFriends = newSelectedFriends.filter((friend, index, self) =>
                        index === self.findIndex((t) => (t.id && t.id === friend.id) || (!t.id && t.name === friend.name))
                    );

                    setSelectedFriends(uniqueFriends);
                }
            } else {
                alert('Não foi possível extrair os dados do rateio pelo áudio. Tente falar novamente.');
            }
        } catch (err) {
            console.error("Audio split processing error", err);
            alert('Erro ao processar o rateio por áudio.');
        } finally {
            setProcessingAudio(false);
        }
    };

    const { isRecording, startRecording, stopRecording, hasSupport } = useSpeechRecognition(handleAudioResult);

    useEffect(() => {
        const fetchFriends = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('friends')
                .select('*')
                .eq('user_id', user.id)
                .order('name');
            if (data) setFriends(data);
        };
        fetchFriends();
    }, [user]);

    const handleAddFriendSelection = (friendId: string) => {
        if (!friendId) return;
        const friend = friends.find(f => f.id === friendId);
        if (friend && !selectedFriends.find(sf => sf.id === friend.id)) {
            setSelectedFriends([...selectedFriends, { id: friend.id, name: friend.name }]);
        }
    };

    const handleRemoveFriendSelection = (index: number) => {
        const newSelected = [...selectedFriends];
        newSelected.splice(index, 1);
        setSelectedFriends(newSelected);
    };

    const handleAddCustomFriend = () => {
        const name = prompt('Nome da pessoa:');
        if (name) {
            const email = prompt('E-mail (opcional, para Gastos Compartilhados):');
            setSelectedFriends([...selectedFriends, { name, email: email ? email.trim() : undefined }]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !amount || selectedFriends.length === 0 || !description) return;
        setLoading(true);

        try {
            const totalAmount = parseFloat(amount);
            // If Installment, calc total count (Current + Remaining). 
            // If Standard, it's just 1.
            const totalInstallmentsCount = isInstallment ? (currentInstallment + remainingInstallments) : 1;

            // Loop Count: How many items to generate?
            // Installment: All of them (from 1 to Total). We generate ALL history to safeguard coherence.
            // Standard: 1.
            const loopCount = isInstallment ? totalInstallmentsCount : 1;

            const groupId = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            // Prepare friends (create non-existing ones)
            const resolvedFriends = [];
            for (const sf of selectedFriends) {
                if (sf.id) {
                    resolvedFriends.push(sf);
                } else {
                    const { data: newFriend, error: friendError } = await supabase
                        .from('friends')
                        .insert([{ user_id: user.id, name: sf.name, email: sf.email || null }])
                        .select()
                        .single();
                    if (friendError) throw friendError;
                    resolvedFriends.push(newFriend);
                }
            }

            // Calculation Logic:
            // - If Installment: Input Amount IS the PARCEL value.
            // - If Standard: Input Amount IS the TOTAL value.

            let monthlyTotal = totalAmount;

            if (!isInstallment) {
                // Standard split: Total amount is divided by 1 month.
                monthlyTotal = totalAmount;
            }

            // Amount owed per friend
            const divisor = splitType === 'half' ? (resolvedFriends.length + 1) : resolvedFriends.length;
            const monthlyOwed = monthlyTotal / divisor;

            // Amount for the user (if half split)
            const userShare = splitType === 'half' ? monthlyOwed : 0;

            const baseDate = new Date(date + 'T00:00:00');

            for (let i = 0; i < loopCount; i++) {
                // Calculate actual installment number (1-based)
                const actualInstallmentNumber = i + 1;

                // Date Calculation
                const installmentDate = new Date(baseDate);
                if (isInstallment) {
                    // Logic: baseDate entered by user usually refers to the CURRENT installment date.
                    // Shift = (Actual - Current). 
                    const shift = actualInstallmentNumber - currentInstallment;
                    installmentDate.setMonth(baseDate.getMonth() + shift);
                } else {
                    // Fixed or Standard: Just add i months
                    installmentDate.setMonth(baseDate.getMonth() + i);
                }

                const currentBillingDate = isNextInvoice
                    ? new Date(installmentDate.getFullYear(), installmentDate.getMonth() + 1, 1).toISOString().split('T')[0]
                    : null;

                // 1. Create Split Expense
                const { data: expenseData, error: expenseError } = await supabase
                    .from('split_expenses')
                    .insert([{
                        created_by: user.id,
                        description: isInstallment ? `${description} (${actualInstallmentNumber}/${totalInstallmentsCount})` : description,
                        amount: monthlyTotal,
                        date: installmentDate.toISOString(),
                        group_id: groupId,
                        installment_number: actualInstallmentNumber,
                        total_installments: totalInstallmentsCount,
                        billing_date: currentBillingDate
                    }])
                    .select()
                    .single();

                if (expenseError) throw expenseError;

                // 2. Add Participants
                const participants = resolvedFriends.map(rf => ({
                    split_expense_id: expenseData.id,
                    friend_id: rf.id,
                    amount_owed: monthlyOwed,
                    is_paid: false
                }));

                const { error: participantError } = await supabase
                    .from('split_participants')
                    .insert(participants);

                if (participantError) throw participantError;

                // 3. Create User Transaction (if 50/50)
                if (splitType === 'half') {
                    const { error: transactionError } = await supabase
                        .from('transactions')
                        .insert([{
                            user_id: user.id,
                            description: description, // Keep original description
                            amount: userShare,
                            date: installmentDate.toISOString(),
                            category: 'Rateio', // Requested fixed category
                            type: 'expense',
                            group_id: groupId,
                            installment_number: actualInstallmentNumber,
                            total_installments: totalInstallmentsCount,
                            billing_date: currentBillingDate
                        }]);

                    if (transactionError) throw transactionError;
                }
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating split:', error);
            alert('Erro ao criar rateio');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-xl animate-scale-up border border-gray-100 dark:border-white/10">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-black/20 flex-shrink-0">
                    <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                        Novo Rateio
                        {processingAudio && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full animate-pulse ml-2">Processando IA...</span>}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                    <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                        {hasSupport && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20 overflow-hidden relative">
                                {isRecording && (
                                    <div className="absolute inset-0 bg-indigo-100/50 dark:bg-indigo-900/40 animate-pulse pointer-events-none"></div>
                                )}
                                <div className="flex items-center gap-3 relative z-10">
                                    <button
                                        type="button"
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm ${isRecording
                                            ? 'bg-red-500 text-white animate-bounce shadow-red-200'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:scale-105'
                                            }`}
                                        title={isRecording ? "Parar gravação" : "Falar despesa"}
                                    >
                                        <span className="material-symbols-outlined text-2xl">
                                            {isRecording ? 'stop_circle' : 'mic'}
                                        </span>
                                    </button>
                                    <div>
                                        <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">Registro Inteligente</h4>
                                        <p className="text-xs text-indigo-700/80 dark:text-indigo-400 mt-0.5">
                                            {isRecording ? "Ouvindo... Fale com clareza." : 'Ex: "Dividir um uber de 50 reais com a Nathy"'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Descrição</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main dark:text-white placeholder-gray-400"
                                        placeholder="Ex: Jantar, Uber..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Valor {isInstallment ? 'da Parc.' : 'Total'}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                            placeholder="0,00"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Data</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Pessoas Participantes</label>
                                    <button
                                        type="button"
                                        onClick={handleAddCustomFriend}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">add</span>
                                        Nova Pessoa
                                    </button>
                                </div>

                                {selectedFriends.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic mb-2">Ninguém selecionado.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {selectedFriends.map((friend, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                                                {friend.name}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFriendSelection(idx)}
                                                    className="hover:text-red-500"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <select
                                    onChange={(e) => {
                                        handleAddFriendSelection(e.target.value);
                                        e.target.value = '';
                                    }}
                                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main dark:text-white cursor-pointer appearance-none"
                                >
                                    <option value="">Adicionar da lista...</option>
                                    {friends.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Como deseja dividir?</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setSplitType('half')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${splitType === 'half' ? 'bg-primary border-primary text-white shadow-md shadow-primary/25' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        50/50
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSplitType('full')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${splitType === 'full' ? 'bg-primary border-primary text-white shadow-md shadow-primary/25' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        Tudo para Amigo
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    {splitType === 'half' ? 'O valor será dividido igualmente entre você e os amigos.' : 'Os amigos pagarão o valor total (você pagou, eles te devem tudo).'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {/* Installment Toggle */}
                                <div
                                    onClick={() => {
                                        setIsInstallment(!isInstallment);
                                    }}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${isInstallment ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400'}`}
                                >
                                    <span className="material-symbols-outlined mb-1">credit_card</span>
                                    <span className="text-xs font-bold">Parcelado</span>
                                    <span className="text-[9px] text-center mt-1 opacity-70">Compras no cartão</span>
                                </div>
                            </div>

                            {isInstallment && (
                                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">Parcela Atual</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={currentInstallment}
                                            onChange={(e) => setCurrentInstallment(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold text-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">Parcelas Restantes</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={remainingInstallments}
                                            onChange={(e) => setRemainingInstallments(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold text-primary"
                                        />
                                    </div>
                                    <p className="col-span-2 text-[10px] text-gray-500 italic">
                                        * Serão criadas {remainingInstallments + 1} transações (De {currentInstallment} até {currentInstallment + remainingInstallments}) vinculadas.
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gray-500">calendar_month</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-text-main dark:text-white">Lançar na próxima fatura?</span>
                                        <span className="text-[10px] text-gray-400">Contabiliza no orçamento do próximo mês.</span>
                                    </div>
                                </div>
                                <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        checked={isNextInvoice}
                                        onChange={(e) => setIsNextInvoice(e.target.checked)}
                                        type="checkbox"
                                        name="toggle"
                                        id="toggle-invoice"
                                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                        style={{
                                            right: isNextInvoice ? '0' : 'auto',
                                            left: isNextInvoice ? 'auto' : '0',
                                            borderColor: isNextInvoice ? '#1A6020' : '#E5E7EB'
                                        }}
                                    />
                                    <label
                                        htmlFor="toggle-invoice"
                                        className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${isNextInvoice ? 'bg-primary' : 'bg-gray-300'}`}
                                    ></label>
                                </div>
                            </div>

                            {/* Submit Buttons — inline so they're always reachable by scroll on mobile */}
                            <div className="flex gap-3 pt-2 pb-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Criando...' : 'Criar Rateio'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewSplitModal;
