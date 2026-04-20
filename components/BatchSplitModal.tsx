import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface BatchSplitEntry {
  id: string;
  description: string;
  amount: string;
  date: string;
  selectedFriends: { id?: string, name: string, email?: string }[];
  splitType: 'half' | 'full';
  
  // Advanced Options
  isFixed: boolean;
  isInstallment: boolean;
  currentInstallment: number;
  remainingInstallments: number;
  isNextInvoice: boolean;
  showAdvanced: boolean; // UI state
}

const createEmptySplitEntry = (): BatchSplitEntry => ({
  id: crypto.randomUUID(),
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  selectedFriends: [],
  splitType: 'half',
  isFixed: false,
  isInstallment: false,
  currentInstallment: 1,
  remainingInstallments: 0,
  isNextInvoice: false,
  showAdvanced: false,
});

const BatchSplitModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<BatchSplitEntry[]>([createEmptySplitEntry()]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleUpdate = (id: string, field: keyof BatchSplitEntry, value: any) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleRemove = (id: string) => {
    if (entries.length === 1) return;
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleAddRow = () => {
    setEntries(prev => [...prev, createEmptySplitEntry()]);
  };

  const toggleAdvanced = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, showAdvanced: !e.showAdvanced } : e));
  };

  const handleAddFriendSelection = (entryId: string, friendId: string) => {
    if (!friendId) return;
    const friend = friends.find(f => f.id === friendId);
    setEntries(prev => prev.map(e => {
      if (e.id === entryId && friend && !e.selectedFriends.find(sf => sf.id === friend.id)) {
        return { ...e, selectedFriends: [...e.selectedFriends, { id: friend.id, name: friend.name }] };
      }
      return e;
    }));
  };

  const handleRemoveFriendSelection = (entryId: string, friendIndex: number) => {
    setEntries(prev => prev.map(e => {
      if (e.id === entryId) {
        const newSelected = [...e.selectedFriends];
        newSelected.splice(friendIndex, 1);
        return { ...e, selectedFriends: newSelected };
      }
      return e;
    }));
  };

  const handleAddCustomFriend = (entryId: string) => {
    const name = prompt('Nome da pessoa:');
    if (name) {
      const email = prompt('E-mail (opcional, para Gastos Compartilhados):');
      setEntries(prev => prev.map(e => {
        if (e.id === entryId) {
           return { ...e, selectedFriends: [...e.selectedFriends, { name, email: email ? email.trim() : undefined }] };
        }
        return e;
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    // Validate
    const validEntries = entries.filter(e => e.description.trim() !== '' && e.amount.trim() !== '' && e.selectedFriends.length > 0);
    if (validEntries.length === 0) {
      alert("Preencha pelo menos um rateio válido com amigos selecionados.");
      return;
    }

    setLoading(true);
    try {
      // For each entry, we process its splits
      for (const entry of validEntries) {
        const totalAmount = parseFloat(entry.amount.replace(/\./g, '').replace(',', '.'));
        if (isNaN(totalAmount)) continue;

        const totalInstallmentsCount = entry.isFixed ? 12 : (entry.isInstallment ? (Number(entry.currentInstallment) + Number(entry.remainingInstallments)) : 1);
        const loopCount = entry.isFixed ? 12 : (entry.isInstallment ? totalInstallmentsCount : 1);

        const groupId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // Resolve friends
        const resolvedFriends = [];
        for (const sf of entry.selectedFriends) {
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

        let monthlyTotal = totalAmount; // For standard
        const divisor = entry.splitType === 'half' ? (resolvedFriends.length + 1) : resolvedFriends.length;
        const monthlyOwed = monthlyTotal / divisor;
        const userShare = entry.splitType === 'half' ? monthlyOwed : 0;
        const baseDate = new Date(entry.date + 'T00:00:00');

        for (let i = 0; i < loopCount; i++) {
          const actualInstallmentNumber = i + 1;
          const installmentDate = new Date(baseDate);

          if (entry.isInstallment || entry.isFixed) {
              const shift = entry.isFixed ? i : (actualInstallmentNumber - Number(entry.currentInstallment));
              installmentDate.setMonth(baseDate.getMonth() + shift);
          } else {
              installmentDate.setMonth(baseDate.getMonth() + i);
          }

          const currentBillingDate = entry.isNextInvoice
              ? new Date(installmentDate.getFullYear(), installmentDate.getMonth() + 1, 1).toISOString().split('T')[0]
              : null;

          // 1. Create Split Expense
          const { data: expenseData, error: expenseError } = await supabase
              .from('split_expenses')
              .insert([{
                  created_by: user.id,
                  description: entry.isFixed ? entry.description : (entry.isInstallment ? `${entry.description} (${actualInstallmentNumber}/${totalInstallmentsCount})` : entry.description),
                  amount: monthlyTotal,
                  date: installmentDate.toISOString(),
                  group_id: groupId,
                  installment_number: actualInstallmentNumber,
                  total_installments: entry.isFixed ? null : totalInstallmentsCount,
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
          if (entry.splitType === 'half') {
              const { error: transactionError } = await supabase
                  .from('transactions')
                  .insert([{
                      user_id: user.id,
                      description: entry.description,
                      amount: userShare,
                      date: installmentDate.toISOString(),
                      category: 'Rateio',
                      type: 'expense',
                      group_id: groupId,
                      installment_number: actualInstallmentNumber,
                      total_installments: entry.isFixed ? null : totalInstallmentsCount,
                      billing_date: currentBillingDate
                  }]);

              if (transactionError) throw transactionError;
          }
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      alert('Erro ao salvar lote de rateio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-100 transition-all">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">groups</span>
            Rateio em Lote
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Headers */}
            <div className="hidden md:grid grid-cols-[120px_1.5fr_120px_2fr_60px_40px] gap-3 px-4 py-3 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
              <div>Data</div>
              <div>Descrição</div>
              <div>Valor (R$)</div>
              <div>Amigos & Divisão</div>
              <div className="text-center">Avanç.</div>
              <div></div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {entries.map((entry, index) => (
                <div key={entry.id} className="flex flex-col transition-colors hover:bg-gray-50/50">
                  <div className="p-4 md:p-0 md:px-4 md:py-2 grid grid-cols-1 md:grid-cols-[120px_1.5fr_120px_2fr_60px_40px] gap-3 items-start md:items-center">
                    
                    {/* Data */}
                    <div className="md:hidden text-xs font-bold text-gray-500 mb-1">Data</div>
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => handleUpdate(entry.id, 'date', e.target.value)}
                      className="w-full px-2 py-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm bg-white"
                    />

                    {/* Descrição */}
                    <div className="md:hidden text-xs font-bold text-gray-500 mt-2 mb-1">Descrição</div>
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={entry.description}
                      onChange={(e) => handleUpdate(entry.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm bg-white"
                    />

                    {/* Valor */}
                    <div className="md:hidden text-xs font-bold text-gray-500 mt-2 mb-1">Valor (R$)</div>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={entry.amount}
                      onChange={(e) => handleUpdate(entry.id, 'amount', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm font-semibold bg-white"
                    />

                    {/* Amigos e Tipo Divisão */}
                    <div className="md:hidden text-xs font-bold text-gray-500 mt-2 mb-1">Amigos & Divisão</div>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                          {entry.selectedFriends.length > 0 ? entry.selectedFriends.map((f, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {f.name}
                              <button type="button" onClick={() => handleRemoveFriendSelection(entry.id, i)} className="hover:text-red-500">
                                <span className="material-symbols-outlined text-[12px]">close</span>
                              </button>
                            </span>
                          )) : <span className="text-xs text-gray-400 italic py-1">Ninguém selecionado</span>}
                        </div>
                        <div className="flex gap-1 items-center">
                          <select
                            onChange={(e) => {
                              handleAddFriendSelection(entry.id, e.target.value);
                              e.target.value = '';
                            }}
                            className="flex-1 px-2 py-1.5 border rounded focus:ring-1 focus:ring-primary bg-white text-xs truncate"
                          >
                            <option value="">Selecionar...</option>
                            {friends.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                          <button onClick={() => handleAddCustomFriend(entry.id)} className="p-1 px-2 text-primary border rounded text-xs whitespace-nowrap bg-white font-medium hover:bg-primary/5">
                            + Novo
                          </button>
                        </div>
                        {/* Split Type toggle */}
                        <div className="flex bg-gray-100 rounded-md p-0.5 self-start">
                          <button 
                            type="button"
                            onClick={() => handleUpdate(entry.id, 'splitType', 'half')}
                            className={`px-3 py-1 text-[10px] font-bold rounded ${entry.splitType === 'half' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                          >
                            50/50
                          </button>
                           <button 
                            type="button"
                            onClick={() => handleUpdate(entry.id, 'splitType', 'full')}
                            className={`px-3 py-1 text-[10px] font-bold rounded ${entry.splitType === 'full' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                          >
                            Tudo p/ Amigo
                          </button>
                        </div>
                    </div>

                    {/* Avançado */}
                    <div className="flex items-center justify-between mt-3 md:mt-0 md:justify-center self-start md:self-center h-full pt-1 md:pt-0">
                      <span className="md:hidden text-xs font-bold text-gray-500">Opções Avançadas</span>
                      <button
                        onClick={() => toggleAdvanced(entry.id)}
                        className={`p-1.5 rounded-lg transition-colors ${entry.showAdvanced || entry.isFixed || entry.isInstallment || entry.isNextInvoice ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        title="Parcelamento, Fixo, Prox Fatura"
                      >
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                      </button>
                    </div>

                    {/* Remover */}
                    <div className="hidden md:flex items-center justify-center self-start md:self-center h-full pt-1 md:pt-0">
                      <button
                        onClick={() => handleRemove(entry.id)}
                        disabled={entries.length === 1}
                        className="text-gray-300 hover:text-red-500 disabled:opacity-50 transition-colors"
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
                    <div className="bg-indigo-50/50 p-4 border-t border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
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
                       <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100">
                         <div className="relative inline-block w-8 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input
                            checked={entry.isNextInvoice}
                            onChange={(e) => handleUpdate(entry.id, 'isNextInvoice', e.target.checked)}
                            className="absolute block w-4 h-4 rounded-full bg-white border-2 appearance-none cursor-pointer checked:right-0 checked:border-primary peer transition-all duration-200 left-0"
                            id={`toggle-invoice-${entry.id}`}
                            type="checkbox"
                          />
                          <label className="block overflow-hidden h-4 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/50" htmlFor={`toggle-invoice-${entry.id}`}></label>
                        </div>
                        <label className="text-[11px] font-medium text-gray-700 cursor-pointer flex flex-col" htmlFor={`toggle-invoice-${entry.id}`}>
                          Próxima Fatura?
                          <span className="text-[9px] text-gray-400">Contabiliza no próx. mês</span>
                        </label>
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
              className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 rounded-xl transition-colors flex items-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">checklist_rtl</span>
              )}
              {loading ? 'Salvando Lote...' : 'Salvar Lote de Rateios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchSplitModal;
