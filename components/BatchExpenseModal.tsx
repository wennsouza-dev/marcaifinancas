import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

interface Props {
  onClose: () => void;
  type?: 'income' | 'expense' | 'investment';
  onSuccess?: () => void;
}

interface BatchEntry {
  id: string;
  description: string;
  amount: string;
  date: string;
  category: string;
  paymentMethod: string;
  // Advanced Options
  isFixed: boolean;
  isInstallment: boolean;
  currentInstallment: number;
  remainingInstallments: number;
  refMonthShift: number;
  showAdvanced: boolean; // UI state
}

const createEmptyEntry = (type: string): BatchEntry => ({
  id: crypto.randomUUID(),
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  category: type === 'expense' ? 'Alimentação' : type === 'investment' ? 'Investimentos' : 'Salário',
  paymentMethod: 'PIX',
  isFixed: false,
  isInstallment: false,
  currentInstallment: 1,
  remainingInstallments: 0,
  refMonthShift: 0,
  showAdvanced: false,
});

const BatchExpenseModal: React.FC<Props> = ({ onClose, type = 'expense', onSuccess }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<BatchEntry[]>([createEmptyEntry(type)]);
  const [loading, setLoading] = useState(false);

  const categories = type === 'expense' 
    ? ["Alimentação", "Transporte", "Lazer", "Moradia", "Eletrônicos", "Saúde", "Outros"] 
    : type === 'income' 
    ? ["Salário", "Freelance", "Investimentos", "Presentes", "Outros"]
    : ["Investimento Geral"];

  const handleUpdate = (id: string, field: keyof BatchEntry, value: any) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleRemove = (id: string) => {
    if (entries.length === 1) return;
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleAddRow = () => {
    setEntries(prev => [...prev, createEmptyEntry(type)]);
  };

  const toggleAdvanced = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, showAdvanced: !e.showAdvanced } : e));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    // Validar se os campos obrigatórios básicos foram preenchidos (descrição e valor) em todas as entradas.
    const validEntries = entries.filter(e => e.description.trim() !== '' && e.amount.trim() !== '');
    if (validEntries.length === 0) {
      alert("Preencha pelo menos um lançamento válido.");
      return;
    }

    setLoading(true);
    try {
      const transactionsToInsert: any[] = [];

      for (const entry of validEntries) {
        const numericAmount = parseFloat(entry.amount.replace(/\./g, '').replace(',', '.'));
        if (isNaN(numericAmount)) continue;

        const groupId = (entry.isInstallment || entry.isFixed) ? crypto.randomUUID() : null;
        const totalInstallments = entry.isFixed ? 12 : (entry.isInstallment ? Number(entry.currentInstallment) + Number(entry.remainingInstallments) : null);
        const baseDate = new Date(entry.date + 'T00:00:00');

        if (entry.isInstallment || entry.isFixed) {
          const count = totalInstallments || 1;
          for (let i = 0; i < count; i++) {
            const actualInstallmentNumber = i + 1;
            const shift = entry.isFixed ? i : (actualInstallmentNumber - Number(entry.currentInstallment));
            
            const installmentDate = new Date(baseDate);
            installmentDate.setMonth(baseDate.getMonth() + shift);

            transactionsToInsert.push({
              user_id: user.id,
              description: entry.isFixed ? entry.description : `${entry.description} (${actualInstallmentNumber}/${totalInstallments})`,
              amount: numericAmount,
              date: installmentDate.toISOString().split('T')[0],
              category: entry.category,
              payment_method: entry.paymentMethod,
              type: type === 'investment' ? 'expense' : type,
              group_id: groupId,
              installment_number: actualInstallmentNumber,
              total_installments: entry.isFixed ? null : totalInstallments,
              billing_date: entry.refMonthShift !== 0 ? new Date(installmentDate.getFullYear(), installmentDate.getMonth() + entry.refMonthShift, 1).toISOString().split('T')[0] : null
            });
          }
        } else {
          transactionsToInsert.push({
            user_id: user.id,
            description: entry.description,
            amount: numericAmount,
            date: baseDate.toISOString().split('T')[0],
            category: entry.category,
            payment_method: entry.paymentMethod,
            type: type === 'investment' ? 'expense' : type,
            billing_date: entry.refMonthShift !== 0 ? new Date(baseDate.getFullYear(), baseDate.getMonth() + entry.refMonthShift, 1).toISOString().split('T')[0] : null
          });
        }
      }

      if (transactionsToInsert.length === 0) {
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) throw error;

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      alert('Erro ao salvar em lote: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-100 transition-all">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className={`material-symbols-outlined ${type === 'expense' ? 'text-expense' : type === 'investment' ? 'text-blue-600' : 'text-primary'}`}>
              library_add
            </span>
            Lançamento em Lote ({type === 'expense' ? 'Despesas' : type === 'investment' ? 'Investimentos' : 'Receitas'})
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Headers */}
            <div className="hidden md:grid grid-cols-[120px_1fr_120px_150px_150px_60px_40px] gap-3 px-4 py-3 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
              <div>Data</div>
              <div>Descrição</div>
              <div>Valor (R$)</div>
              <div>Categoria</div>
              <div>Pgto</div>
              <div className="text-center">Avanç.</div>
              <div></div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {entries.map((entry, index) => (
                <div key={entry.id} className="flex flex-col transition-colors hover:bg-gray-50/50">
                  <div className="p-4 md:p-0 md:px-4 md:py-2 grid grid-cols-1 md:grid-cols-[120px_1fr_120px_150px_150px_60px_40px] gap-3 items-center">
                    
                    {/* Mobile Label */}
                    <div className="md:hidden text-xs font-bold text-gray-500 mb-1">Data</div>
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => handleUpdate(entry.id, 'date', e.target.value)}
                      className="w-full px-2 py-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm bg-white"
                    />

                    <div className="md:hidden text-xs font-bold text-gray-500 mt-2 mb-1">Descrição</div>
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={entry.description}
                      onChange={(e) => handleUpdate(entry.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm bg-white"
                    />

                    <div className="md:hidden text-xs font-bold text-gray-500 mt-2 mb-1">Valor (R$)</div>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={entry.amount}
                      onChange={(e) => handleUpdate(entry.id, 'amount', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm font-semibold bg-white"
                    />

                    <div className="md:hidden text-xs font-bold text-gray-500 mt-2 mb-1">Categoria</div>
                    <select
                      value={entry.category}
                      onChange={(e) => handleUpdate(entry.id, 'category', e.target.value)}
                      className="w-full px-2 py-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm bg-white"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <div className="md:hidden text-xs font-bold text-gray-500 mt-2 mb-1">Pagamento</div>
                    <select
                      value={entry.paymentMethod}
                      onChange={(e) => handleUpdate(entry.id, 'paymentMethod', e.target.value)}
                      className="w-full px-2 py-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm bg-white"
                    >
                      {["PIX", "Cartão de Crédito", "Cartão de Débito", "Transferência", "Dinheiro"].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <div className="flex items-center justify-between mt-3 md:mt-0 md:justify-center">
                      <span className="md:hidden text-xs font-bold text-gray-500">Opções Avançadas</span>
                      <button
                        onClick={() => toggleAdvanced(entry.id)}
                        className={`p-1.5 rounded-lg transition-colors ${entry.showAdvanced || entry.isFixed || entry.isInstallment || entry.refMonthShift !== 0 ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        title="Parcelamento, Fixo, Mês Referência"
                      >
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                      </button>
                    </div>

                    <div className="hidden md:flex items-center justify-center">
                      <button
                        onClick={() => handleRemove(entry.id)}
                        disabled={entries.length === 1}
                        className="text-gray-300 hover:text-red-500 disabled:opacity-50 transition-colors mt-2 md:mt-0"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                    {/* Mobile Remove button */}
                    <div className="md:hidden flex justify-end mt-2">
                       <button
                        onClick={() => handleRemove(entry.id)}
                        disabled={entries.length === 1}
                        className="text-red-500 text-sm font-semibold flex items-center gap-1 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        Remover Lançamento
                      </button>
                    </div>
                  </div>

                  {/* Advanced Options Drawer */}
                  {entry.showAdvanced && (
                    <div className="bg-indigo-50/50 p-4 border-t border-indigo-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Fixed Toggle */}
                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100">
                        <div className="relative inline-block w-8 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input
                            checked={entry.isFixed}
                            onChange={(e) => {
                              handleUpdate(entry.id, 'isFixed', e.target.checked);
                              if (e.target.checked) handleUpdate(entry.id, 'isInstallment', false);
                            }}
                            className="absolute block w-4 h-4 rounded-full bg-white border-2 appearance-none cursor-pointer checked:right-0 checked:border-primary peer transition-all duration-200 left-0"
                            id={`toggle-fixed-${entry.id}`}
                            type="checkbox"
                          />
                          <label className="block overflow-hidden h-4 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/50" htmlFor={`toggle-fixed-${entry.id}`}></label>
                        </div>
                        <label className="text-[11px] font-medium text-gray-700 cursor-pointer flex flex-col" htmlFor={`toggle-fixed-${entry.id}`}>
                          Lançamento Fixo
                          <span className="text-[9px] text-gray-400">Repetir 12 meses</span>
                        </label>
                      </div>

                      {/* Installment Toggle */}
                      <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-3">
                          <div className="relative inline-block w-8 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                              checked={entry.isInstallment}
                              onChange={(e) => {
                                handleUpdate(entry.id, 'isInstallment', e.target.checked);
                                if (e.target.checked) handleUpdate(entry.id, 'isFixed', false);
                              }}
                              className="absolute block w-4 h-4 rounded-full bg-white border-2 appearance-none cursor-pointer checked:right-0 checked:border-primary peer transition-all duration-200 left-0"
                              id={`toggle-install-${entry.id}`}
                              type="checkbox"
                            />
                            <label className="block overflow-hidden h-4 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/50" htmlFor={`toggle-install-${entry.id}`}></label>
                          </div>
                          <label className="text-[11px] font-medium text-gray-700 cursor-pointer" htmlFor={`toggle-install-${entry.id}`}>
                            Parcelamento
                          </label>
                        </div>
                        {entry.isInstallment && (
                          <div className="flex gap-2 mt-1">
                            <div className="flex-1">
                              <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Parc. Atual</label>
                              <input 
                                type="number" 
                                min="1" 
                                value={entry.currentInstallment} 
                                onChange={(e) => handleUpdate(entry.id, 'currentInstallment', Number(e.target.value))}
                                className="w-full border rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Restantes</label>
                              <input 
                                type="number" 
                                min="0" 
                                value={entry.remainingInstallments} 
                                onChange={(e) => handleUpdate(entry.id, 'remainingInstallments', Number(e.target.value))}
                                className="w-full border rounded px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reference Month */}
                      <div className="bg-white p-3 rounded-xl border border-indigo-100 flex flex-col justify-center">
                        <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                          Mês de Referência
                        </label>
                        <div className="flex rounded-md shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleUpdate(entry.id, 'refMonthShift', entry.refMonthShift === -1 ? 0 : -1)}
                            className={`flex-1 py-1 text-[10px] items-center justify-center font-bold border rounded-l-md truncate px-1 transition-colors ${entry.refMonthShift === -1 ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                          >
                            Anterior
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate(entry.id, 'refMonthShift', 0)}
                            className={`flex-1 py-1 text-[10px] items-center justify-center font-bold border-t border-b truncate px-1 transition-colors ${entry.refMonthShift === 0 ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                          >
                            Atual
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate(entry.id, 'refMonthShift', entry.refMonthShift === 1 ? 0 : 1)}
                            className={`flex-1 py-1 text-[10px] items-center justify-center font-bold border rounded-r-md truncate px-1 transition-colors ${entry.refMonthShift === 1 ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                          >
                            Próximo
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                onClick={handleAddRow}
                className="text-sm font-bold text-primary flex items-center gap-1 hover:text-primary-hover hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Adicionar mais uma linha
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <div className="text-sm text-gray-500 font-medium">
            {entries.length} registro(s) no lote
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
              Cancelar
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading} 
              className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-colors flex items-center gap-2 ${type === 'investment' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-primary hover:bg-primary-hover shadow-primary/25'}`}
            >
              {loading ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">checklist</span>
              )}
              {loading ? 'Salvando Lote...' : `Salvar Lote de ${type === 'expense' ? 'Despesas' : type === 'investment' ? 'Investimentos' : 'Receitas'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchExpenseModal;
