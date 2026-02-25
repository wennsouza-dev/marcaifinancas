import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import ChartComponent from '../components/ChartComponent';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import NewExpenseModal from '../components/NewExpenseModal';

import EditTransactionModal from '../components/EditTransactionModal';

import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import SmartAccountantWidget from '../components/SmartAccountantWidget';
import FinancialAdvisorWidget from '../components/FinancialAdvisorWidget';
import { useSmartAccountant } from '../hooks/useSmartAccountant';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [modalType, setModalType] = useState<'income' | 'expense' | 'investment'>('expense');
  const [modalAudioText, setModalAudioText] = useState<string | undefined>(undefined);
  const [filteredForAnalysis, setFilteredForAnalysis] = useState<any[]>([]);

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

      // SMART ACCOUNTANT ANALYSIS (We analyze ALL filtered transactions for the month)
      setFilteredForAnalysis(filteredTransactions);

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

  const openModal = (type: 'income' | 'expense' | 'investment', audioText?: string) => {
    setModalType(type);
    setModalAudioText(audioText);
    setIsModalOpen(true);
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
      fetchDashboardData();
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const { alerts } = useSmartAccountant(filteredForAnalysis, stats.balance);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:px-12 md:py-10">
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

      {/* Smart Accountant Widget */}
      <SmartAccountantWidget alerts={alerts} />

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
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-4 sm:p-6 md:p-8 transition-all">
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
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-expense'
                      }`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {t.type === 'income' ? 'attach_money' : 'receipt_long'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-text-main dark:text-white break-words">{t.description}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-expense'
                        }`}>
                        {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {t.total_installments > 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded font-bold">
                          {t.installment_number}/{t.total_installments}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(t);
                        }}
                        className="p-1.5 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteModal(t);
                        }}
                        className="p-1.5 hover:text-expense transition-colors text-gray-300"
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

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <button
          onClick={() => openModal('income')}
          className="flex-1 h-12 sm:h-14 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 font-bold hover:bg-primary-hover transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer z-10"
        >
          <span className="material-symbols-outlined text-xl">add_circle</span>
          Nova Receita
        </button>
        <button
          onClick={() => openModal('expense')}
          className="flex-1 h-12 sm:h-14 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-expense rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer z-10"
        >
          <span className="material-symbols-outlined text-xl">remove_circle</span>
          Nova Despesa
        </button>
        <button
          onClick={() => openModal('investment')}
          className="flex-1 h-12 sm:h-14 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 font-bold hover:bg-blue-700 transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer z-10"
        >
          <span className="material-symbols-outlined text-xl">trending_up</span>
          Novo Investimento
        </button>
      </div>

      {
        isModalOpen && (
          <NewExpenseModal
            onClose={() => {
              setIsModalOpen(false);
              setModalAudioText(undefined);
            }}
            type={modalType}
            onSuccess={fetchDashboardData}
            initialAudioText={modalAudioText}
          />
        )
      }

      {
        isEditModalOpen && editingTransaction && (
          <EditTransactionModal
            transaction={editingTransaction}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingTransaction(null);
            }}
            onSuccess={fetchDashboardData}
          />
        )
      }

      {
        showDeleteModal && transactionToDelete && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setTransactionToDelete(null);
            }}
            onConfirm={confirmDelete}
            isRecurring={!!transactionToDelete.group_id}
          />
        )
      }
      <FinancialAdvisorWidget
        transactions={filteredForAnalysis}
        stats={stats}
        onAddTransaction={(type, text) => openModal(type, text)}
      />
    </div>
  );
};

export default Dashboard;
