
import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="animate-fade-in w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main dark:text-white">Visão Geral</h2>
          <p className="text-gray-500 text-sm mt-1">Bem-vindo de volta, aqui está o resumo financeiro de hoje.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-surface-dark dark:text-white dark:border-[#2e4230] dark:hover:bg-[#253626] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            Outubro 2023
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-shadow shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-[20px]">download</span>
            Exportar
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          label="Saldo atual" 
          value="R$ 12.450,00" 
          trend="+15%" 
          icon="account_balance" 
          color="primary" 
        />
        <StatCard 
          label="Entradas do mês" 
          value="R$ 5.200,00" 
          trend="+8%" 
          icon="arrow_upward" 
          color="success" 
        />
        <StatCard 
          label="Saídas do mês" 
          value="R$ 2.100,00" 
          trend="-5%" 
          icon="arrow_downward" 
          color="danger" 
        />
        <StatCard 
          label="Resultado mensal" 
          value="R$ 3.100,00" 
          trend="+12%" 
          icon="pie_chart" 
          color="info" 
        />
      </section>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-text-main dark:text-white">Fluxo de Caixa Mensal</h3>
              <p className="text-sm text-gray-500">Comparativo de Entradas e Saídas</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary-light"></span>
                <span className="text-gray-600 dark:text-gray-400">Entradas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary/20 dark:bg-primary/40"></span>
                <span className="text-gray-600 dark:text-gray-400">Saídas</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[280px] w-full flex items-end justify-between gap-2 px-2 pb-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
              <div className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>
              <div className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>
              <div className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>
              <div className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>
              <div className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>
            </div>
            <ChartBar height1="40%" height2="25%" week="Semana 1" />
            <ChartBar height1="65%" height2="30%" week="Semana 2" />
            <ChartBar height1="50%" height2="45%" week="Semana 3" />
            <ChartBar height1="85%" height2="35%" week="Semana 4" />
          </div>
          <div className="flex justify-between w-full px-2 mt-2 text-xs font-medium text-gray-500">
            <span className="w-full text-center">Semana 1</span>
            <span className="w-full text-center">Semana 2</span>
            <span className="w-full text-center">Semana 3</span>
            <span className="w-full text-center">Semana 4</span>
          </div>
        </div>

        {/* Quick Actions & Recent */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6">
            <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center justify-center w-full p-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-md shadow-primary/20 group">
                <span className="material-symbols-outlined mr-2 group-hover:-translate-y-0.5 transition-transform">add_circle</span>
                Nova Receita
              </button>
              <button className="flex items-center justify-center w-full p-3 bg-white hover:bg-red-50 text-danger border border-danger/30 rounded-lg font-semibold transition-all dark:bg-transparent dark:hover:bg-red-900/20">
                <span className="material-symbols-outlined mr-2">remove_circle</span>
                Nova Despesa
              </button>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 text-text-main rounded-lg text-sm font-medium transition-colors dark:bg-[#253626] dark:text-white dark:hover:bg-[#2e4230]">
                  <span className="material-symbols-outlined mb-1 text-primary">analytics</span>
                  Relatórios
                </button>
                <button className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 text-text-main rounded-lg text-sm font-medium transition-colors dark:bg-[#253626] dark:text-white dark:hover:bg-[#2e4230]">
                  <span className="material-symbols-outlined mb-1 text-primary">account_balance</span>
                  Contábil
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-main dark:text-white">Transações Recentes</h3>
              <a className="text-sm text-primary font-semibold hover:underline" href="#">Ver todas</a>
            </div>
            <div className="space-y-4">
              <RecentItem icon="work" title="Salário Mensal" time="Hoje, 10:00" amount="+ R$ 4.500,00" color="success" />
              <RecentItem icon="shopping_cart" title="Supermercado" time="Ontem, 18:30" amount="- R$ 450,20" color="danger" />
              <RecentItem icon="local_gas_station" title="Combustível" time="20 Out, 14:15" amount="- R$ 200,00" color="danger" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string, trend: string, icon: string, color: string }> = ({ label, value, trend, icon, color }) => {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-bg text-primary dark:bg-primary/20 dark:text-primary-light',
    success: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    danger: 'bg-red-50 text-danger dark:bg-red-900/20 dark:text-red-400',
    info: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col gap-4 group hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className={`size-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorClasses[color]}`}>{trend}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <h3 className="text-2xl font-bold text-text-main dark:text-white mt-1">{value}</h3>
      </div>
    </div>
  );
};

const ChartBar: React.FC<{ height1: string, height2: string, week: string }> = ({ height1, height2 }) => (
  <div className="relative z-10 flex gap-1 w-full justify-center h-full items-end group">
    <div className={`w-3 md:w-5 rounded-t-sm bg-primary-light group-hover:opacity-80 transition-opacity`} style={{ height: height1 }}></div>
    <div className={`w-3 md:w-5 rounded-t-sm bg-primary/20 dark:bg-primary/40 group-hover:opacity-80 transition-opacity`} style={{ height: height2 }}></div>
  </div>
);

const RecentItem: React.FC<{ icon: string, title: string, time: string, amount: string, color: string }> = ({ icon, title, time, amount, color }) => {
  const iconBg = color === 'success' ? 'bg-green-50 text-primary-light dark:bg-green-900/20' : 'bg-red-50 text-danger dark:bg-red-900/20';
  const textAmount = color === 'success' ? 'text-primary-light' : 'text-danger';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-full flex items-center justify-center ${iconBg}`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-main dark:text-white">{title}</p>
          <p className="text-xs text-gray-500">{time}</p>
        </div>
      </div>
      <span className={`text-sm font-bold ${textAmount}`}>{amount}</span>
    </div>
  );
};

export default Dashboard;
