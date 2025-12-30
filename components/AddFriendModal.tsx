import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

interface AddFriendModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('friends')
                .insert([{ user_id: user.id, name }]);

            if (error) throw error;
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding friend:', error);
            alert('Erro ao adicionar amigo. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-up">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-main dark:text-white">Adicionar Amigo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Nome</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main dark:text-white"
                            placeholder="Ex: Ana Silva"
                            required
                        />
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
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Salvando...' : 'Adicionar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFriendModal;
