import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

interface NewSplitModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const NewSplitModal: React.FC<NewSplitModalProps> = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [friends, setFriends] = useState<any[]>([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedFriend, setSelectedFriend] = useState('');
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // New Fields
    const [splitType, setSplitType] = useState<'half' | 'full'>('half');
    const [isInstallment, setIsInstallment] = useState(false);
    const [installmentsCount, setInstallmentsCount] = useState('1');
    const [isNextInvoice, setIsNextInvoice] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !amount || !selectedFriend || !description) return;
        setLoading(true);

        try {
            const totalAmount = parseFloat(amount);
            const numInstallments = isInstallment ? parseInt(installmentsCount) : 1;
            const groupId = crypto.randomUUID();

            // Calculate amount per month
            const monthlyTotal = totalAmount / numInstallments;
            // Amount owed by friend per month
            const monthlyOwed = splitType === 'half' ? monthlyTotal / 2 : monthlyTotal;

            const baseDate = new Date(date + 'T00:00:00');

            for (let i = 0; i < numInstallments; i++) {
                const installmentDate = new Date(baseDate);
                installmentDate.setMonth(baseDate.getMonth() + i);

                // 1. Create Split Expense
                const { data: expenseData, error: expenseError } = await supabase
                    .from('split_expenses')
                    .insert([{
                        created_by: user.id,
                        description: isInstallment ? `${description} (${i + 1}/${numInstallments})` : description,
                        amount: monthlyTotal,
                        date: installmentDate.toISOString(),
                        group_id: groupId,
                        installment_number: i + 1,
                        total_installments: numInstallments,
                        billing_date: isNextInvoice ? new Date(installmentDate.getFullYear(), installmentDate.getMonth() + 1, 1).toISOString().split('T')[0] : null
                    }])
                    .select()
                    .single();

                if (expenseError) throw expenseError;

                // 2. Add Participant
                const { error: participantError } = await supabase
                    .from('split_participants')
                    .insert([{
                        split_expense_id: expenseData.id,
                        friend_id: selectedFriend,
                        amount_owed: monthlyOwed,
                        is_paid: false
                    }]);

                if (participantError) throw participantError;
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating split:', error);
            alert('Erro ao criar rateio. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-up max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-main dark:text-white">Novo Rateio</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main dark:text-white"
                            placeholder="Ex: Jantar, Uber..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Valor Total (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main dark:text-white"
                            placeholder="0,00"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Data</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main dark:text-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Como deseja dividir?</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setSplitType('half')}
                                className={`py-2 rounded-lg border text-sm font-bold transition-all ${splitType === 'half' ? 'bg-primary border-primary text-white' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400'}`}
                            >
                                50/50
                            </button>
                            <button
                                type="button"
                                onClick={() => setSplitType('full')}
                                className={`py-2 rounded-lg border text-sm font-bold transition-all ${splitType === 'full' ? 'bg-primary border-primary text-white' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400'}`}
                            >
                                Tudo para Amigo
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 px-1">
                            {splitType === 'half' ? 'O amigo deve metade do valor total.' : 'O amigo deve o valor total integralmente.'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Pessoa</label>
                        <select
                            value={selectedFriend}
                            onChange={(e) => setSelectedFriend(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main dark:text-white"
                            required
                        >
                            <option value="">Selecione...</option>
                            {friends.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Installments Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-text-secondary">credit_card</span>
                            <span className="text-sm font-medium text-text-main dark:text-white">Parcelar no cartão?</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsInstallment(!isInstallment)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${isInstallment ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isInstallment ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {isInstallment && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Número de Parcelas</label>
                            <select
                                value={installmentsCount}
                                onChange={(e) => setInstallmentsCount(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main dark:text-white"
                            >
                                {[...Array(12)].map((_, i) => (
                                    <option key={i + 1} value={String(i + 1)}>{i + 1}x</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Next Invoice Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 mt-2">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-text-secondary text-sm">event_repeat</span>
                                <span className="text-sm font-medium text-text-main dark:text-white">Lançar na próxima fatura?</span>
                            </div>
                            <span className="text-[10px] text-gray-500 italic ml-6">Contabiliza no orçamento do próximo mês.</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsNextInvoice(!isNextInvoice)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${isNextInvoice ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isNextInvoice ? 'left-5.5' : 'left-0.5'}`}></div>
                        </button>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || friends.length === 0}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Criando...' : 'Criar Rateio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewSplitModal;
