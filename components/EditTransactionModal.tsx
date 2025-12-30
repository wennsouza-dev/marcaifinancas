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
    const [refMonthShift, setRefMonthShift] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const [editMode, setEditMode] = useState<'only' | 'all'>('only');

    useEffect(() => {
        if (transaction.billing_date) {
            const d = new Date(transaction.date + 'T00:00:00');
            const bd = new Date(transaction.billing_date + 'T00:00:00');
            const shift = (bd.getFullYear() - d.getFullYear()) * 12 + (bd.getMonth() - d.getMonth());
            setRefMonthShift(shift);
        }
    }, [transaction]);

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
                // Do not update date for 'all' mode as it would overwrite future recurring dates
                date: editMode === 'only' ? formattedDate : undefined
            };

            // Remove undefined keys
            Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

            if (editMode === 'only') {
                // Determine billing_date for this single transaction
                updatePayload.billing_date = refMonthShift !== 0
                    ? new Date(baseDate.getFullYear(), baseDate.getMonth() + refMonthShift, 1).toISOString().split('T')[0]
                    : null;

                const { error } = await supabase
                    .from('transactions')
                    .update(updatePayload)
                    .eq('id', transaction.id);

                if (error) throw error;

            } else {
                // Bulk Update (All future installments)
                if (!transaction.group_id) throw new Error("ID do grupo não encontrado.");

                // Check if we need to calculate specific billing dates for each installment (if shift is applied)
                if (refMonthShift !== 0) {
                    // Fetch all affected installments to calculate their individual billing dates
                    const { data: installments, error: fetchError } = await supabase
                        .from('transactions')
                        .select('id, date')
                        .eq('group_id', transaction.group_id)
                        .gte('installment_number', transaction.installment_number);

                    if (fetchError) throw fetchError;

                    // Update each installment individually to respect the relative shift
                    const updates = installments.map(inst => {
                        const instDate = new Date(inst.date + 'T00:00:00');
                        const newBillingDate = new Date(instDate.getFullYear(), instDate.getMonth() + refMonthShift, 1).toISOString().split('T')[0];

                        return supabase
                            .from('transactions')
                            .update({ ...updatePayload, billing_date: newBillingDate })
                            .eq('id', inst.id);
                    });

                    await Promise.all(updates);

                } else {
                    // If no shift (current month), set billing_date to null (default) or handle standard update
                    // Warning: If we want to set it to "Month of the Date", null is usually fine if the system defaults to date.
                    // But if we explicitly want to RESET it, we set to null.

                    const bulkPayload = { ...updatePayload, billing_date: null };

                    const { error } = await supabase
                        .from('transactions')
                        .update(bulkPayload)
                        .eq('group_id', transaction.group_id)
                        .gte('installment_number', transaction.installment_number);

                    if (error) throw error;
                }
            }

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
                            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Mês de Referência (Orçamento)</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRefMonthShift(refMonthShift === -1 ? 0 : -1)}
                                    className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${refMonthShift === -1 ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                >
                                    <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                                    Mês Anterior
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRefMonthShift(0)}
                                    className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${refMonthShift === 0 ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                >
                                    Mês Atual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRefMonthShift(refMonthShift === 1 ? 0 : 1)}
                                    className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${refMonthShift === 1 ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                >
                                    Próximo Mês
                                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </button>
                            </div>
                            <p className="mt-2 text-[10px] text-gray-500 italic">* Define em qual mês esta transação será contabilizada no seu orçamento.</p>
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
