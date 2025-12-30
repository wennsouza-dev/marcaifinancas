import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

interface Props {
  onClose: () => void;
  type?: 'income' | 'expense';
  onSuccess?: () => void;
}

const NewExpenseModal: React.FC<Props> = ({ onClose, type = 'expense', onSuccess }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(type === 'expense' ? 'Alimentação' : 'Salário');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Installment logic
  const [isInstallment, setIsInstallment] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState(1);
  const [remainingInstallments, setRemainingInstallments] = useState(0);
  const [refMonthShift, setRefMonthShift] = useState(0); // -1: Previous, 0: Current, 1: Next

  const handleSubmit = async () => {
    if (!description || !amount || !date || !user) return;

    setLoading(true);
    try {
      const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
      const groupId = isInstallment ? crypto.randomUUID() : null;
      const totalInstallments = isInstallment ? Number(currentInstallment) + Number(remainingInstallments) : null;

      const transactionsToInsert = [];
      // Use YYYY-MM-DD + T00:00:00 to stay in local day
      const baseDate = new Date(date + 'T00:00:00');

      if (isInstallment) {
        const count = Number(remainingInstallments) + 1;
        for (let i = 0; i < count; i++) {
          const installmentDate = new Date(baseDate);
          // Increment month while trying to keep the same day
          installmentDate.setMonth(baseDate.getMonth() + i);

          transactionsToInsert.push({
            user_id: user.id,
            description: `${description} (${Number(currentInstallment) + i}/${totalInstallments})`,
            amount: numericAmount,
            date: installmentDate.toISOString().split('T')[0],
            category,
            type,
            group_id: groupId,
            installment_number: Number(currentInstallment) + i,
            total_installments: totalInstallments,
            billing_date: refMonthShift !== 0 ? new Date(installmentDate.getFullYear(), installmentDate.getMonth() + refMonthShift, 1).toISOString().split('T')[0] : null
          });
        }
      } else {
        transactionsToInsert.push({
          user_id: user.id,
          description,
          amount: numericAmount,
          date: baseDate.toISOString().split('T')[0],
          category,
          type,
          billing_date: refMonthShift !== 0 ? new Date(baseDate.getFullYear(), baseDate.getMonth() + refMonthShift, 1).toISOString().split('T')[0] : null
        });
      }

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

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
            <span className={`material-symbols-outlined ${type === 'expense' ? 'text-expense' : 'text-primary'}`}>
              {type === 'expense' ? 'remove_circle' : 'add_circle'}
            </span>
            {type === 'expense' ? 'Nova Despesa' : 'Nova Receita'}
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
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 placeholder-gray-400"
                placeholder={type === 'expense' ? "Ex: Compra de Notebook" : "Ex: Salário Mensal"}
                type="text"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Valor {isInstallment ? 'da Parcela' : 'Total'}</label>
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
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                type="date"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                {type === 'expense' ? (
                  <>
                    <option>Alimentação</option>
                    <option>Transporte</option>
                    <option>Lazer</option>
                    <option>Moradia</option>
                    <option>Eletrônicos</option>
                    <option>Saúde</option>
                    <option>Outros</option>
                  </>
                ) : (
                  <>
                    <option>Salário</option>
                    <option>Freelance</option>
                    <option>Investimentos</option>
                    <option>Presentes</option>
                    <option>Outros</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-dashed border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  checked={isInstallment}
                  onChange={() => setIsInstallment(!isInstallment)}
                  className="absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-primary peer transition-all duration-200 left-0"
                  id="toggle-installment"
                  type="checkbox"
                />
                <label className="block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/50" htmlFor="toggle-installment"></label>
              </div>
              <label className="text-sm font-medium text-gray-700 cursor-pointer select-none" htmlFor="toggle-installment">
                Compra parcelada (Cartão de Crédito)
              </label>
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
                  * Serão criadas {remainingInstallments + 1} transações ({currentInstallment} a {Number(currentInstallment) + Number(remainingInstallments)}) vinculadas.
                </p>
              </div>
            )}
          </div>

          {/* Reference Month Selection */}
          <div className="pt-2 border-t border-dashed border-gray-200">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              {type === 'expense' ? 'Contabilizar em qual mês?' : 'Mês de Referência'}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRefMonthShift(refMonthShift === -1 ? 0 : -1)}
                className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${refMonthShift === -1 ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                Mês Anterior
              </button>
              <button
                type="button"
                onClick={() => setRefMonthShift(0)}
                className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${refMonthShift === 0 ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
              >
                Mês Atual
              </button>
              <button
                type="button"
                onClick={() => setRefMonthShift(refMonthShift === 1 ? 0 : 1)}
                className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${refMonthShift === 1 ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
              >
                Próximo Mês
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 italic mt-2 ml-1">
              * Define em qual mês {type === 'expense' ? 'esta despesa' : 'esta receita'} será contabilizada no seu orçamento.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md shadow-primary/20 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check</span>
            {loading ? 'Salvando...' : 'Salvar ' + (type === 'expense' ? 'Despesa' : 'Receita')}
          </button>
        </div>
      </div>
    </div>
  );
};

const SimulationLine: React.FC<{ label: string, installment: string, active?: boolean }> = ({ label, installment, active }) => (
  <div className={`flex items-center text-xs ${active ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
    <div className={`w-2 h-2 rounded-full mr-2 ${active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
    <span className="font-medium w-16">{label}</span>
    <span className="flex-1 border-b border-dashed border-gray-200 dark:border-white/10 mx-2"></span>
    <span>{installment}</span>
  </div>
);

export default NewExpenseModal;
