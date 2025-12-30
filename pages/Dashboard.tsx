import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import ChartComponent from '../components/ChartComponent';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    balance: 0,
    income: 0,
    expenses: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      const transactions = data || [];

      const balance = transactions.reduce((acc, curr) => curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);
      const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);

      setStats({ balance, income, expenses });
      setRecentTransactions(transactions.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  return (
    <div className="animate-fade-in w-full max-w-7xl mx-auto px-6 py-8 md:px-12 md:py-10">
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
          value={`R$ ${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="+12%"
          trendUp={true}
          icon="account_balance_wallet"
          color="blue"
        />
        <StatCard
          title="Entradas"
          value={`R$ ${stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="+8%"
          trendUp={true}
          icon="arrow_upward"
          color="emerald"
        />
        <StatCard
          title="Saídas"
          value={`R$ ${stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="-3%"
          trendUp={false}
          icon="arrow_downward"
          color="red"
        />
      </div>

      {/* Charts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-main dark:text-white">Fluxo de Caixa</h2>
            <select className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Últimos 6 meses</option>
              <option>Este ano</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ChartComponent />
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-main dark:text-white">Transações Recentes</h2>
            <button className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">Ver tudo</button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500">Carregando...</p>
            ) : recentTransactions.length === 0 ? (
              <p className="text-center text-gray-500">Nenhuma transação recente.</p>
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
                      <p className="text-sm font-bold text-text-main dark:text-white">{t.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-expense'
                    }`}>
                    {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button className="flex-1 min-w-[150px] h-14 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 font-bold hover:bg-primary-hover transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add_circle</span>
          Nova Receita
        </button>
        <button className="flex-1 min-w-[150px] h-14 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-expense rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">remove_circle</span>
          Nova Despesa
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
