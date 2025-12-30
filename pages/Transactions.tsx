
import React, { useState } from 'react';
import NewExpenseModal from '../components/NewExpenseModal';

const Transactions: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const transactions = [
    { date: '12 Out 2023', description: 'Salário Mensal', category: 'Outros', value: 'R$ 5.000,00', type: 'income', icon: 'work', color: 'blue' },
    { date: '14 Out 2023', description: 'Supermercado Silva', category: 'Alimentação', value: 'R$ 450,00', type: 'expense', icon: 'shopping_cart', color: 'orange' },
    { date: '15 Out 2023', description: 'Uber Viagens', category: 'Transporte', value: 'R$ 24,90', type: 'expense', icon: 'directions_car', color: 'purple' },
    { date: '16 Out 2023', description: 'Cinema & Pipoca', category: 'Lazer', value: 'R$ 85,00', type: 'expense', icon: 'movie', color: 'teal' },
    { date: '18 Out 2023', description: 'Aluguel Apartamento', category: 'Moradia', value: 'R$ 1.800,00', type: 'expense', icon: 'home', color: 'indigo' },
  ];

  return (
    <div className="animate-fade-in w-full max-w-[1440px] mx-auto px-4 md:px-10 py-8">
      {showModal && <NewExpenseModal onClose={() => setShowModal(false)} />}
      
      {/* Header & Title */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-main dark:text-white">Controle Financeiro</h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">Gerencie suas receitas e despesas com inteligência.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm text-expense dark:text-red-400 text-sm font-bold"
          >
            <span className="material-symbols-outlined text-[20px]">remove_circle</span>
            <span>Nova Despesa</span>
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-primary-hover text-white transition-colors shadow-md shadow-primary/20 text-sm font-bold">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Nova Receita</span>
          </button>
        </div>
      </div>

      {/* Stats Mini Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatSummary title="Entradas (Mês)" value="R$ 5.200,00" trend="+12%" icon="trending_up" color="green" />
        <StatSummary title="Saídas (Mês)" value="R$ 3.150,00" trend="+5%" icon="trending_down" color="red" />
        <BalanceSummary title="Saldo Atual" value="R$ 2.050,00" />
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-surface-dark rounded-t-xl border-b border-gray-100 dark:border-white/5 p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <FilterButton icon="calendar_month" text="Outubro 2023" />
          <FilterButton icon="label" text="Todas Categorias" />
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white placeholder-gray-400" placeholder="Buscar transação..." type="text"/>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white dark:bg-surface-dark rounded-b-xl shadow-sm border border-t-0 border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-[120px]">Data</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Descrição</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-[180px]">Categoria</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right w-[150px]">Valor</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center w-[100px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {transactions.map((t, idx) => (
                <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{t.date}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full hidden sm:block ${t.type === 'income' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                        <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.description}</p>
                        <p className="text-xs text-gray-500">Recorrente</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`text-sm font-bold ${t.type === 'income' ? 'text-primary' : 'text-expense'}`}>
                      {t.type === 'income' ? '+' : '-'} {t.value}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                      <button className="p-1 text-gray-400 hover:text-expense transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando <span className="font-medium text-gray-900 dark:text-white">1</span> a <span className="font-medium text-gray-900 dark:text-white">5</span> de <span className="font-medium text-gray-900 dark:text-white">28</span> resultados
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">Anterior</button>
            <button className="px-3 py-1 rounded border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatSummary: React.FC<{ title: string, value: string, trend: string, icon: string, color: 'green' | 'red' }> = ({ title, value, trend, icon, color }) => (
  <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${color === 'green' ? 'bg-green-50 text-primary' : 'bg-red-50 text-expense'}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${color === 'green' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
        <span className="material-symbols-outlined text-[14px]">arrow_upward</span> {trend}
      </span>
    </div>
    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const BalanceSummary: React.FC<{ title: string, value: string }> = ({ title, value }) => (
  <div className="bg-primary text-white rounded-xl p-6 shadow-lg shadow-primary/25 relative overflow-hidden group">
    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
        <span className="material-symbols-outlined">account_balance</span>
      </div>
    </div>
    <p className="text-primary-light text-sm font-medium mb-1 relative z-10">{title}</p>
    <p className="text-3xl font-bold relative z-10">{value}</p>
  </div>
);

const FilterButton: React.FC<{ icon: string, text: string }> = ({ icon, text }) => (
  <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors whitespace-nowrap">
    <span className="material-symbols-outlined text-[18px]">{icon}</span>
    {text}
    <span className="material-symbols-outlined text-[18px] text-gray-400">expand_more</span>
  </button>
);

export default Transactions;
