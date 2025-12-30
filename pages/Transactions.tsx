import React, { useState, useEffect } from 'react';
import NewExpenseModal from '../components/NewExpenseModal';
import EditTransactionModal from '../components/EditTransactionModal';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const Transactions: React.FC = () => {
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterType, setFilterType] = useState('todos'); // todos, income, expense

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

  const handleDelete = async (transaction: any) => {
    let deleteMode: 'only' | 'all' = 'only';

    if (transaction.group_id) {
      const confirmAll = confirm('Esta é uma transação parcelada. Deseja excluir apenas esta parcela (Cancelar) ou esta e todas as futuras (OK)?');
      deleteMode = confirmAll ? 'all' : 'only';
    } else {
      if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    }

    try {
      let query = supabase.from('transactions').delete();

      if (deleteMode === 'all' && transaction.group_id) {
        query = query.eq('group_id', transaction.group_id).gte('installment_number', transaction.installment_number);
      } else {
        query = query.eq('id', transaction.id);
      }

      const { error } = await query;
      if (error) throw error;

      fetchTransactions();
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
    return matchesMonth && matchesSearch && matchesCategory && matchesType;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Entradas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600">trending_up</span>
            </div>
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trends.income === null || trends.income >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <span className="material-symbols-outlined text-[10px]">{trends.income === null || trends.income >= 0 ? 'arrow_upward' : 'arrow_downward'}</span> {trends.income === null ? 'Novo' : `${Math.abs(Math.round(trends.income))}%`}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 mb-1 block">Entradas (Mês)</span>
            <span className="text-2xl font-bold text-text-main">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500">trending_down</span>
            </div>
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trends.expense === null || trends.expense <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <span className="material-symbols-outlined text-[10px]">{trends.expense === null ? '--' : (trends.expense > 0 ? 'arrow_upward' : 'arrow_downward')}</span> {trends.expense === null ? 'Novo' : `${Math.abs(Math.round(trends.expense))}%`}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 mb-1 block">Saídas (Mês)</span>
            <span className="text-2xl font-bold text-text-main">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Saldo Atual - Featured Card */}
        <div className="bg-primary p-6 rounded-2xl shadow-sm border border-primary relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-white">account_balance</span>
            </div>
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm`}>
              <span className="material-symbols-outlined text-[10px]">{trends.balance === null || trends.balance >= 0 ? 'arrow_upward' : 'arrow_downward'}</span> {trends.balance === null ? 'Novo' : `${Math.abs(Math.round(trends.balance))}%`}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-white/80 mb-1 block">Saldo Atual</span>
            <span className="text-3xl font-bold text-white">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Filters - Styled */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex gap-3 flex-1 overflow-x-auto pb-1 md:pb-0">
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border-none rounded-xl focus:ring-0 text-sm font-medium text-gray-700 cursor-pointer min-w-[120px]"
            >
              {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border-none rounded-xl focus:ring-0 text-sm font-medium text-gray-700 cursor-pointer min-w-[90px]"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border-none rounded-xl focus:ring-0 text-sm font-medium text-gray-700 cursor-pointer min-w-[140px]"
          >
            <option value="Todas">Todas Categorias</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Transporte">Transporte</option>
            <option value="Lazer">Lazer</option>
            <option value="Eletrônicos">Eletrônicos</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            placeholder="Buscar transação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium text-text-main placeholder-gray-400"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      <span className="text-sm">Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl opacity-20">receipt_long</span>
                      <span className="text-sm">Nenhuma transação encontrada.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/80 transition-colors group">
                    {/* Data */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      <div className="flex flex-col">
                        <span className="text-text-main font-bold">{new Date(t.date + 'T00:00:00').getDate().toString().padStart(2, '0')} {new Date(t.date + 'T00:00:00').toLocaleString('pt-BR', { month: 'short' })}</span>
                        <span className="text-xs text-gray-400">{new Date(t.date + 'T00:00:00').getFullYear()}</span>
                      </div>
                    </td>

                    {/* Descrição */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'
                          }`}>
                          <span className="material-symbols-outlined filled text-[20px]">
                            {t.category === 'Alimentação' ? 'restaurant' :
                              t.category === 'Transporte' ? 'directions_car' :
                                t.category === 'Lazer' ? 'movie' :
                                  t.category === 'Moradia' ? 'home' :
                                    t.type === 'income' ? 'account_balance_wallet' : 'shopping_bag'}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-text-main dark:text-white truncate max-w-[120px] sm:max-w-none">{t.description}</p>
                            {t.billing_date && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 flex items-center gap-1 shrink-0">
                                <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                                Ref: {new Date(t.billing_date + 'T00:00:00').toLocaleString('pt-BR', { month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                          <span className="text-[10px] text-gray-400 truncate">{t.type === 'income' ? 'Receita recebida' : 'Pagamento realizado'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.category === 'Alimentação' ? 'bg-orange-100 text-orange-700' :
                        t.category === 'Transporte' ? 'bg-purple-100 text-purple-700' :
                          t.category === 'Lazer' ? 'bg-cyan-100 text-cyan-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {t.category}
                      </span>
                    </td>

                    {/* Valor */}
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-expense'
                      }`}>
                      <div className="flex flex-col items-end">
                        <span>{t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        {t.total_installments > 0 && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded font-bold">
                            {t.installment_number}/{t.total_installments}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTransaction(t);
                            setShowEditModal(true);
                          }}
                          className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="text-gray-400 hover:text-expense p-1.5 rounded-lg hover:bg-expense/5 transition-colors"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewExpenseModal && (
        <NewExpenseModal
          onClose={() => setShowNewExpenseModal(false)}
          type={modalType}
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
    </div>
  );
};

export default Transactions;
