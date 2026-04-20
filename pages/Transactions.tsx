import React, { useState, useEffect } from 'react';
import NewExpenseModal from '../components/NewExpenseModal';
import EditTransactionModal from '../components/EditTransactionModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import BatchExpenseModal from '../components/BatchExpenseModal';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import BudgetSection from '../components/BudgetSection';

const Transactions: React.FC = () => {
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [showBatchExpenseModal, setShowBatchExpenseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterType, setFilterType] = useState('todos'); // todos, income, expense
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('Todos');

  // Filtering state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const handleOpenModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setShowNewExpenseModal(true);
  };

  const handleOpenDeleteModal = (transaction: any) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (deleteMode: 'only' | 'all') => {
    if (!transactionToDelete) return;

    try {
      let query = supabase.from('transactions').delete();

      if (deleteMode === 'all' && transactionToDelete.group_id) {
        query = query.eq('group_id', transactionToDelete.group_id).gte('installment_number', transactionToDelete.installment_number);
      } else {
        query = query.eq('id', transactionToDelete.id);
      }

      const { error } = await query;
      if (error) throw error;

      fetchTransactions();
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  const handleSuccess = () => {
    fetchTransactions();
  };

  // Calculate stats based on filtered data
  const filteredTransactions = transactions.filter(t => {
    const referenceDate = t.billing_date || t.date;
    const d = new Date(referenceDate + 'T00:00:00');
    const matchesMonth = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todas' || t.category === filterCategory;
    const matchesType = filterType === 'todos' || t.type === filterType;
    const matchesPaymentMethod = filterPaymentMethod === 'Todos' || t.payment_method === filterPaymentMethod;
    return matchesMonth && matchesSearch && matchesCategory && matchesType && matchesPaymentMethod;
  });

  const totalBalance = filteredTransactions.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Previous month range
  const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const previousTransactions = transactions.filter(t => {
    const referenceDate = t.billing_date || t.date;
    const d = new Date(referenceDate + 'T00:00:00');
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  const prevIncome = previousTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const prevExpense = previousTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const prevBalance = prevIncome - prevExpense;

  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const trends = {
    balance: calcTrend(totalBalance, prevBalance),
    income: calcTrend(totalIncome, prevIncome),
    expense: calcTrend(totalExpense, prevExpense)
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:px-12 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-text-main text-3xl md:text-4xl font-black leading-tight tracking-tight">Controle Financeiro</h1>
          <p className="text-gray-500 text-sm mt-2">Gerencie suas receitas e despesas com inteligência.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBatchExpenseModal(true)}
            className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px] filled">library_add</span>
            Lote
          </button>
          <button
            onClick={() => handleOpenModal('expense')}
            className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white border border-red-100 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px] filled">remove_circle</span>
            Nova Despesa
          </button>
          <button
            onClick={() => handleOpenModal('income')}
            className="flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[20px] filled">add_circle</span>
            Nova Receita
          </button>
        </div>
      </div>

      {/* Stats Cards - Reordered and Styled */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="grid grid-cols-2 gap-6">
          {/* Entradas */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600">trending_up</span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 mb-1 block">Entradas (Mês)</span>
              <span className="text-2xl font-bold text-text-main">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Saídas */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">trending_down</span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 mb-1 block">Saídas (Mês)</span>
              <span className="text-2xl font-bold text-text-main">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Saldo Atual - Featured Card */}
        <div className="bg-primary p-6 rounded-2xl shadow-sm border border-primary relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-white">account_balance</span>
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-white/80 mb-1 block">Saldo Atual</span>
            <span className="text-3xl font-bold text-white">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Budget Section */}
      {(() => {
        // Compute month-filtered expenses per category (no other filters applied, just month)
        const monthTxs = transactions.filter(t => {
          const ref = t.billing_date || t.date;
          const d = new Date(ref + 'T00:00:00');
          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && t.type === 'expense';
        });
        const expensesByCategory: Record<string, number> = {};
        monthTxs.forEach(t => {
          expensesByCategory[t.category || 'Outros'] = (expensesByCategory[t.category || 'Outros'] || 0) + Number(t.amount);
        });
        return <BudgetSection currentExpenses={expensesByCategory} month={selectedMonth} year={selectedYear} />;
      })()}

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Row 1: Mês + Ano + Tipo */}
        <div className="grid grid-cols-3 gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl focus:ring-0 focus:outline-none text-xs font-semibold text-gray-700 cursor-pointer w-full"
          >
            {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl focus:ring-0 focus:outline-none text-xs font-semibold text-gray-700 cursor-pointer w-full"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl focus:ring-0 focus:outline-none text-xs font-semibold text-gray-700 cursor-pointer w-full"
          >
            <option value="todos">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </div>

        {/* Row 2: Categoria + Forma de Pagamento */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl focus:ring-0 focus:outline-none text-xs font-semibold text-gray-700 cursor-pointer w-full"
          >
            <option value="Todas">Todas Cats.</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Transporte">Transporte</option>
            <option value="Lazer">Lazer</option>
            <option value="Eletrônicos">Eletrônicos</option>
            <option value="Outros">Outros</option>
          </select>

          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="px-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl focus:ring-0 focus:outline-none text-xs font-semibold text-gray-700 cursor-pointer w-full"
          >
            <option value="Todos">Todos Meios</option>
            <option value="PIX">PIX</option>
            <option value="Cartão de Crédito">Cartão Créd.</option>
            <option value="Cartão de Débito">Cartão Déb.</option>
            <option value="Transferência">Transferência</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>
        </div>

        {/* Row 3: Search */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Buscar transação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium text-text-main placeholder-gray-400"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-surface-dark rounded-xl p-6 text-center text-gray-500 border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              <span className="text-sm">Carregando...</span>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white dark:bg-surface-dark rounded-xl p-6 text-center text-gray-500 border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-4xl opacity-20">receipt_long</span>
              <span className="text-sm">Nenhuma transação encontrada.</span>
            </div>
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <div key={t.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Left Side: Icon + Details */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                  <span className="material-symbols-outlined filled text-[24px]">
                    {t.category === 'Alimentação' ? 'restaurant' :
                      t.category === 'Transporte' ? 'directions_car' :
                        t.category === 'Lazer' ? 'movie' :
                          t.category === 'Moradia' ? 'home' :
                            t.type === 'income' ? 'account_balance_wallet' : 'shopping_bag'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-base font-bold text-text-main dark:text-white break-words leading-tight">{t.description}</p>
                    {t.billing_date && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                        {new Date(t.billing_date + 'T00:00:00').toLocaleString('pt-BR', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${t.category === 'Alimentação' ? 'bg-orange-100 text-orange-700' :
                      t.category === 'Transporte' ? 'bg-purple-100 text-purple-700' :
                        t.category === 'Lazer' ? 'bg-cyan-100 text-cyan-700' :
                          'bg-gray-100 text-gray-600'
                      }`}>
                      {t.category}
                    </span>
                    {t.payment_method && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {t.payment_method === 'PIX' ? 'qr_code_scanner' :
                            t.payment_method.includes('Cartão') ? 'credit_card' :
                              t.payment_method === 'Dinheiro' ? 'payments' : 'account_balance'}
                        </span>
                        {t.payment_method}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Amount + Actions */}
              <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 sm:gap-8 pl-[64px] sm:pl-0 mt-[-8px] sm:mt-0">
                <div className="flex flex-col items-start sm:items-end">
                  <p className="text-xs text-gray-400 mb-0.5">{t.type === 'income' ? 'Recebido' : 'Pago'}</p>
                  <span className={`text-base font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-expense'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {t.total_installments > 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded font-bold mt-1">
                      {t.installment_number}/{t.total_installments}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingTransaction(t);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(t)}
                    className="p-2 text-gray-400 hover:text-expense hover:bg-expense/5 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showNewExpenseModal && (
        <NewExpenseModal
          onClose={() => setShowNewExpenseModal(false)}
          type={modalType}
          onSuccess={handleSuccess}
        />
      )}

      {showBatchExpenseModal && (
        <BatchExpenseModal
          onClose={() => setShowBatchExpenseModal(false)}
          type="expense"
          onSuccess={handleSuccess}
        />
      )}

      {showEditModal && editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => {
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {showDeleteModal && transactionToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setTransactionToDelete(null);
          }}
          onConfirm={confirmDelete}
          isRecurring={!!transactionToDelete.group_id}
        />
      )}
    </div>
  );
};

export default Transactions;
