import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

interface Props {
    transaction: any;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditTransactionModal: React.FC<Props> = ({ transaction, onClose, onSuccess }) => {
    const [description, setDescription] = useState(transaction.description || '');
    const [amount, setAmount] = useState(transaction.amount?.toString().replace('.', ',') || '');
    const [date, setDate] = useState(transaction.date || '');
    const [category, setCategory] = useState(transaction.category || '');
    const [isNextInvoice, setIsNextInvoice] = useState(!!transaction.billing_date);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const [editMode, setEditMode] = useState<'only' | 'all'>('only');

    const handleSubmit = async () => {
        if (!description || !amount || !date || !user) return;

        setLoading(true);
        try {
            const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
            const formattedDate = new Date(date + 'T00:00:00').toISOString().split('T')[0];
            const baseDate = new Date(formattedDate + 'T00:00:00');

            const updatePayload: any = {
                description,
                amount: numericAmount,
                category,
                date: editMode === 'only' ? formattedDate : undefined
            };

            if (editMode === 'only') {
                updatePayload.billing_date = isNextInvoice
                    ? new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1).toISOString().split('T')[0]
                    : null;
            }

            let query = supabase.from('transactions').update(updatePayload);

            if (editMode === 'all' && transaction.group_id) {
                query = query.eq('group_id', transaction.group_id).gte('installment_number', transaction.installment_number);
            } else {
                query = query.eq('id', transaction.id);
            }

            const { error } = await query;
            if (error) throw error;

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 transition-all">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">edit</span>
                        Editar Transação
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Descrição</label>
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Valor</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                                <input
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="0,00"
                                    type="text"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Data</label>
                            <input
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                                type="date"
                                disabled={editMode === 'all'}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Categoria</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                            >
                                <option>Alimentação</option>
                                <option>Transporte</option>
                                <option>Lazer</option>
                                <option>Moradia</option>
                                <option>Eletrônicos</option>
                                <option>Saúde</option>
                                <option>Salário</option>
                                <option>Freelance</option>
                                <option>Investimentos</option>
                                <option>Outros</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl mt-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <span className="material-symbols-outlined">calendar_month</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Lançar na Próxima Fatura</p>
                                        <p className="text-[10px] text-gray-500">Contabilizar no próximo mês</p>
                                    </div>
                                </div>
                                <label className={`relative inline-flex items-center cursor-pointer ${editMode === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isNextInvoice}
                                        onChange={(e) => setIsNextInvoice(e.target.checked)}
                                        disabled={editMode === 'all'}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                            </div>
                            {editMode === 'all' && (
                                <p className="mt-1 text-[10px] text-orange-600 italic">
                                    * Alteração de fatura disponível apenas no modo "Apenas Esta".
                                </p>
                            )}
                        </div>
                    </div>

                    {transaction.group_id && (
                        <div className="pt-2 border-t border-dashed border-gray-200">
                            <label className="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Opções de Parcelamento</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setEditMode('only')}
                                    className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${editMode === 'only' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'}`}
                                >
                                    <span className="material-symbols-outlined">filter_1</span>
                                    Apenas Esta
                                </button>
                                <button
                                    onClick={() => setEditMode('all')}
                                    className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${editMode === 'all' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'}`}
                                >
                                    <span className="material-symbols-outlined">dynamic_feed</span>
                                    Esta e Próximas
                                </button>
                            </div>
                            <p className="mt-2 text-[10px] text-gray-500 italic">
                                * Editar "Esta e Próximas" atualizará descrição, valor e categoria das parcelas futuras.
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md shadow-primary/20 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditTransactionModal;
