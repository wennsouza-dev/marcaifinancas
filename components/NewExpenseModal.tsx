import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseTransactionFromAudio } from '../services/geminiService';

interface Props {
  onClose: () => void;
  type?: 'income' | 'expense' | 'investment';
  onSuccess?: () => void;
  initialAudioText?: string;
}

const NewExpenseModal: React.FC<Props> = ({ onClose, type = 'expense', onSuccess, initialAudioText }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(type === 'expense' ? 'Alimentação' : type === 'investment' ? 'Investimentos' : 'Salário');
  const [loading, setLoading] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);
  const { user } = useAuth();

  const handleAudioResult = async (text: string) => {
    if (!text.trim()) return;
    setProcessingAudio(true);
    try {
      console.log('Audio Result Start - Received text:', text);
      const { data: parsed, error, rawTranscript } = await parseTransactionFromAudio(text);
      console.log('Audio Result Parsed:', parsed);

      if (parsed) {
        setDescription(parsed.description);
        setAmount(parsed.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));

        // Only update category if it matches the current modal type to avoid UX confusion
        if (type === 'expense' && ["Alimentação", "Transporte", "Lazer", "Moradia", "Eletrônicos", "Saúde", "Outros"].includes(parsed.category)) {
          setCategory(parsed.category);
        } else if (type === 'income' && ["Salário", "Freelance", "Investimentos", "Presentes", "Outros"].includes(parsed.category)) {
          setCategory(parsed.category);
        } else {
          setCategory('Outros');
        }

        if (parsed.isInstallment) {
          setIsInstallment(true);
          setIsFixed(false);
          setCurrentInstallment(1);
          // If they say "in 3 installments", the remaining is 2 (since current is 1)
          // If the parser returns 3, we set remaining to 2.
          // We ensure it's at least 1 remaining if it's an installment, or 0 if parsed count is 1 or less
          setRemainingInstallments(Math.max(0, parsed.installmentsCount - 1));
        } else {
          setIsInstallment(false);
        }
      } else {
        alert(`Não foi possível extrair dados.\n\nTexto Entendido: "${rawTranscript || text}"\nErro: ${error || 'Desconhecido'}\n\nTente falar novamente.`);
      }
    } catch (err: any) {
      console.error("Audio processing error", err);
      alert(`Erro ao processar o áudio: ${err.message || 'Desconhecido'}`);
    } finally {
      setProcessingAudio(false);
    }
  };

  const { isRecording, startRecording, stopRecording, hasSupport } = useSpeechRecognition(handleAudioResult);

  // Automatically start processing if initialAudioText is provided
  React.useEffect(() => {
    if (initialAudioText) {
      handleAudioResult(initialAudioText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAudioText]);

  // Installment logic
  const [isInstallment, setIsInstallment] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState(1);
  const [remainingInstallments, setRemainingInstallments] = useState(0);
  const [refMonthShift, setRefMonthShift] = useState(0); // -1: Previous, 0: Current, 1: Next
  const handleSubmit = async () => {
    if (!description || !amount || !date || !user) return;

    setLoading(true);
    try {
      const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
      const groupId = isInstallment ? crypto.randomUUID() : null;

      // Calculate Total Installments based on user input (Current + Remaining)
      // e.g. Current=5, Remaining=5 => Total=10.
      const totalInstallments = isInstallment ? Number(currentInstallment) + Number(remainingInstallments) : null;

      const transactionsToInsert = [];
      // Use YYYY-MM-DD + T00:00:00 to stay in local day
      const baseDate = new Date(date + 'T00:00:00');

      if (isInstallment) {
        // Generate ALL installments (from 1 to Total) to keep history consistent
        // Loop count is the Total Number of Installments
        const count = totalInstallments || 1;

        for (let i = 0; i < count; i++) {
          const actualInstallmentNumber = i + 1;

          // Calculate Date Logic:
          // User input 'date' usually refers to the CURRENT installment date.
          // We need to shift the date based on the difference between Actual and Current.
          // Shift = Actual - Current.
          // e.g. Current=5 (May). Actual=1. Shift = 1-5 = -4 months. (Jan)
          // e.g. Current=5 (May). Actual=6. Shift = 6-5 = +1 month. (Jun)

          const shift = actualInstallmentNumber - Number(currentInstallment);

          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(baseDate.getMonth() + shift);

          transactionsToInsert.push({
            user_id: user.id,
            description: `${description} (${actualInstallmentNumber}/${totalInstallments})`,
            amount: numericAmount,
            date: installmentDate.toISOString().split('T')[0],
            category,
            type: type === 'investment' ? 'expense' : type,
            group_id: groupId,
            installment_number: actualInstallmentNumber,
            total_installments: totalInstallments,
            billing_date: refMonthShift !== 0 ? new Date(installmentDate.getFullYear(), installmentDate.getMonth() + refMonthShift, 1).toISOString().split('T')[0] : null
          });
        }
      } else if (isFixed) {
        // FIXED LOGIC: Create 12 recurring transactions
        const count = 12;
        const fixedGroupId = crypto.randomUUID(); // Always group them for "This and Next" editing

        for (let i = 0; i < count; i++) {
          const recurringDate = new Date(baseDate);
          recurringDate.setMonth(baseDate.getMonth() + i);

          transactionsToInsert.push({
            user_id: user.id,
            description: description, // Do not append numbers for fixed expenses
            amount: numericAmount, // Full amount for each month
            date: recurringDate.toISOString().split('T')[0],
            category,
            type: type === 'investment' ? 'expense' : type,
            group_id: fixedGroupId,
            installment_number: i + 1, // Needed for "This and Next" editing logic order
            total_installments: null, // Set to null so UI doesn't show "1/12" badge
            billing_date: refMonthShift !== 0 ? new Date(recurringDate.getFullYear(), recurringDate.getMonth() + refMonthShift, 1).toISOString().split('T')[0] : null
          });
        }
      } else {
        transactionsToInsert.push({
          user_id: user.id,
          description,
          amount: numericAmount,
          date: baseDate.toISOString().split('T')[0],
          category,
          type: type === 'investment' ? 'expense' : type,
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 transition-all">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className={`material-symbols-outlined ${type === 'expense' ? 'text-expense' : type === 'investment' ? 'text-blue-600' : 'text-primary'}`}>
              {type === 'expense' ? 'remove_circle' : type === 'investment' ? 'trending_up' : 'add_circle'}
            </span>
            {type === 'expense' ? 'Nova Despesa' : type === 'investment' ? 'Novo Investimento' : 'Nova Receita'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Smart Input Actions */}
          {hasSupport && (
            <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20 overflow-hidden relative">
              {isRecording && (
                <div className="absolute inset-0 bg-indigo-100/50 dark:bg-indigo-900/40 animate-pulse pointer-events-none"></div>
              )}
              <div className="flex items-center gap-3 relative z-10">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={processingAudio}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm ${processingAudio ? 'opacity-50 cursor-not-allowed bg-indigo-400 text-white' : isRecording ? 'bg-red-500 text-white animate-bounce shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:scale-105'}`}
                  title={isRecording ? "Parar gravação" : "Falar transação"}
                >
                  {processingAudio ? (
                    <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-2xl">
                      {isRecording ? 'stop_circle' : 'mic'}
                    </span>
                  )}
                </button>
                <div>
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm flex items-center gap-2">
                    Registro Inteligente
                    {processingAudio && <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full animate-pulse font-medium">Processando...</span>}
                  </h4>
                  <p className="text-xs text-indigo-700/80 dark:text-indigo-400 mt-0.5">
                    {processingAudio ? "Aguarde a IA interpretar..." : isRecording ? "Ouvindo... Fale com clareza." : type === 'expense' ? 'Ex: "Gastei 50 no pão"' : type === 'investment' ? 'Ex: "Investi 100 no Tesouro Direto"' : 'Ex: "Recebi 1500 de salário"'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Descrição</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 placeholder-gray-400"
                placeholder={type === 'expense' ? "Ex: Compra de Notebook" : type === 'investment' ? "Ex: CDB, Tesouro Direto" : "Ex: Salário Mensal"}
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
            {type !== 'investment' && (
              <div className="flex flex-col gap-3 mb-4">
                {/* Installment Toggle */}
                <div className="flex items-center gap-3">
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                      checked={isInstallment}
                      onChange={() => {
                        setIsInstallment(!isInstallment);
                        if (!isInstallment) setIsFixed(false); // Disable fixed if enabling installment
                      }}
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

                {/* Fixed Toggle */}
                <div className="flex items-center gap-3">
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                      checked={isFixed}
                      onChange={() => {
                        setIsFixed(!isFixed);
                        if (!isFixed) setIsInstallment(false); // Disable installment if enabling fixed
                      }}
                      className="absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-primary peer transition-all duration-200 left-0"
                      id="toggle-fixed"
                      type="checkbox"
                    />
                    <label className="block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/50" htmlFor="toggle-fixed"></label>
                  </div>
                  <label className="text-sm font-medium text-gray-700 cursor-pointer select-none" htmlFor="toggle-fixed">
                    Fixo (Repetir por 12 meses)
                  </label>
                </div>
              </div>
            )}

            {isInstallment && type !== 'investment' && (
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

            {isFixed && type !== 'investment' && (
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <p className="text-xs text-primary font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined">repeat</span>
                  Esta transação será repetida automaticamente pelos próximos 12 meses (incluindo o atual).
                </p>
                <p className="text-[10px] text-gray-500 italic mt-2">
                  * Útil para aluguel, assinaturas, salários fixos, etc. Você poderá editar valores futuros individualmente ou em grupo depois.
                </p>
              </div>
            )}
          </div>

          {/* Reference Month Selection */}
          <div className="pt-2 border-t border-dashed border-gray-200">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              {type === 'expense' ? 'Contabilizar em qual mês?' : type === 'investment' ? 'Mês do Investimento' : 'Mês de Referência'}
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
              * Define em qual mês {type === 'expense' ? 'esta despesa' : type === 'investment' ? 'este investimento' : 'esta receita'} será contabilizada no seu orçamento.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-md transition-colors flex items-center gap-2 ${type === 'investment' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-primary hover:bg-primary-hover shadow-primary/20'}`}>
            <span className="material-symbols-outlined text-[18px]">check</span>
            {loading ? 'Salvando...' : 'Salvar ' + (type === 'expense' ? 'Despesa' : type === 'investment' ? 'Investimento' : 'Receita')}
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
