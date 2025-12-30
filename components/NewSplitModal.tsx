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

    useEffect(() => {
        const fetchFriends = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('friends')
                .select('*')
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
            // 1. Create Split Expense
            const { data: expenseData, error: expenseError } = await supabase
                .from('split_expenses')
                .insert([{
                    created_by: user.id,
                    description,
                    amount: parseFloat(amount),
                    date: new Date().toISOString()
                }])
                .select()
                .single();

            if (expenseError) throw expenseError;

            // 2. Add Participant (Assuming 50/50 split for simplicity interaction for now, or full amount owed by friend)
            // Let's assume user paid and friend owes the full amount entered (e.g. "I paid 50 for your lunch")
            // Or typically "I paid 100 total, split with friend".
            // Implementation choice: "Amount" is the TOTAL bill.
            // If split equally: friend owes 50%.
            // Simplification: User enters "Amount Friend Owes". 
            // Let's go with: "Valor Total" and "Dividido com...". Friend owes 50%.

            const totalAmount = parseFloat(amount);
            const amountOwed = totalAmount / 2; // Simple 50/50 split

            const { error: participantError } = await supabase
                .from('split_participants')
                .insert([{
                    split_expense_id: expenseData.id,
                    friend_id: selectedFriend,
                    amount_owed: amountOwed,
                    is_paid: false
                }]);

            if (participantError) throw participantError;

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
            <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-up">
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
                        <p className="text-xs text-gray-500 mt-1">Será dividido 50% para você e 50% para o amigo.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Dividir com</label>
                        <select
                            value={selectedFriend}
                            onChange={(e) => setSelectedFriend(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main dark:text-white"
                            required
                        >
                            <option value="">Selecione um amigo</option>
                            {friends.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        {friends.length === 0 && (
                            <p className="text-xs text-orange-500 mt-1">Adicione amigos primeiro para dividir contas.</p>
                        )}
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
