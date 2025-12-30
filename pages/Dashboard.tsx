import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import ChartComponent from '../components/ChartComponent';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import NewExpenseModal from '../components/NewExpenseModal';

import EditTransactionModal from '../components/EditTransactionModal';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    balanceTrend: 0,
    incomeTrend: 0,
    expensesTrend: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');

  // Filtering state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: true }); // Ascending for chart order

      if (error) throw error;
      const allTransactions = data || [];

      // Current month range
      const filteredTransactions = allTransactions.filter(t => {
        const referenceDate = t.billing_date || t.date;
        const d = new Date(referenceDate + 'T00:00:00');
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });

      // Previous month range
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const previousTransactions = allTransactions.filter(t => {
        const referenceDate = t.billing_date || t.date;
        const d = new Date(referenceDate + 'T00:00:00');
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      });

      // Current Month Stats
      const balance = filteredTransactions.reduce((acc, curr) => curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);
      const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);

      // Previous Month Stats
      const prevBalance = previousTransactions.reduce((acc, curr) => curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);
      const prevIncome = previousTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const prevExpenses = previousTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);

      // Trend Calculation
      const calcTrend = (current: number, previous: number) => {
        if (previous === 0) return null;
        return ((current - previous) / Math.abs(previous)) * 100;
      };

      setStats({
        balance,
        income,
        expenses,
        balanceTrend: calcTrend(balance, prevBalance),
        incomeTrend: calcTrend(income, prevIncome),
        expensesTrend: calcTrend(expenses, prevExpenses)
      });

      // Process Recent (Sorted by date descending from filtered set)
      const sortedDesc = [...filteredTransactions].sort((a, b) => new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime());
      setRecentTransactions(sortedDesc.slice(0, 5));

      // Process Chart Data (Last 6 months ending in selectedMonth)
      const chartMonths = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(selectedYear, selectedMonth, 1);
        d.setMonth(d.getMonth() - i);
        chartMonths.push({
          month: d.getMonth(),
          year: d.getFullYear(),
          label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        });
      }

      const formattedChartData = chartMonths.map(m => {
        const monthTransactions = allTransactions.filter(t => {
          const referenceDate = t.billing_date || t.date;
          const d = new Date(referenceDate + 'T00:00:00');
          return d.getMonth() === m.month && d.getFullYear() === m.year;
        });
        const mIncome = monthTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const mExpense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
        return {
          label: m.label.charAt(0).toUpperCase() + m.label.slice(1).replace('.', ''),
          income: mIncome,
          expense: mExpense
        };
      });
      setChartData(formattedChartData);

    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, selectedMonth, selectedYear]);

  const openModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setIsModalOpen(true);
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
      fetchDashboardData();
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 md:px-12 md:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Visão Geral</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Acompanhe suas finanças em tempo real.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-gray-500 dark:text-gray-400">Data de Hoje</p>
          <p className="text-lg font-bold text-text-main dark:text-white capitalize">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Saldo Total"
          value={stats.balance === 0 && recentTransactions.length === 0 ? "R$ --" : `R$ ${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={stats.balanceTrend === null ? "Novo" : `${stats.balanceTrend > 0 ? '+' : ''}${Math.round(stats.balanceTrend)}%`}
          trendUp={stats.balanceTrend === null || stats.balanceTrend >= 0}
          icon="account_balance_wallet"
          color="emerald"
        />
        <StatCard
          title="Entradas"
          value={stats.income === 0 && recentTransactions.length === 0 ? "R$ --" : `R$ ${stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={stats.incomeTrend === null ? "Novo" : `${stats.incomeTrend > 0 ? '+' : ''}${Math.round(stats.incomeTrend)}%`}
          trendUp={stats.incomeTrend === null || stats.incomeTrend >= 0}
          icon="arrow_upward"
          color="emerald"
        />
        <StatCard
          title="Saídas"
          value={stats.expenses === 0 && recentTransactions.length === 0 ? "R$ --" : `R$ ${stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={stats.expensesTrend === null ? "Novo" : `${stats.expensesTrend > 0 ? '+' : ''}${Math.round(stats.expensesTrend)}%`}
          trendUp={stats.expensesTrend === null || stats.expensesTrend <= 0} // Expenses going down is good
          icon="arrow_downward"
          color="red"
        />
      </div>

      {/* Featured Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-main dark:text-white">Fluxo de Caixa</h2>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ChartComponent data={chartData} />
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6 md:p-8 transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-main dark:text-white">Transações Recentes</h2>
            <button className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">Ver tudo</button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500">Carregando...</p>
            ) : recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">history</span>
                <p className="text-sm">Nenhuma transação recente.</p>
              </div>
            ) : (
              recentTransactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors group cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-expense'
                      }`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {t.type === 'income' ? 'attach_money' : 'receipt_long'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-main dark:text-white line-clamp-1">{t.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-expense'
                        }`}>
                        {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {t.total_installments > 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded font-bold">
                          {t.installment_number}/{t.total_installments}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-1 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1 hover:text-expense transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => openModal('income')}
          className="flex-1 min-w-[150px] h-14 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 font-bold hover:bg-primary-hover transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Nova Receita
        </button>
        <button
          onClick={() => openModal('expense')}
          className="flex-1 min-w-[150px] h-14 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-expense rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">remove_circle</span>
          Nova Despesa
        </button>
      </div>

      {isModalOpen && (
        <NewExpenseModal
          onClose={() => setIsModalOpen(false)}
          type={modalType}
          onSuccess={fetchDashboardData}
        />
      )}

      {isEditModalOpen && editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTransaction(null);
          }}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default Dashboard;
