
import React from 'react';

const SplitExpenses: React.FC = () => {
  return (
    <div className="animate-fade-in w-full max-w-[1440px] mx-auto px-4 md:px-10 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-main dark:text-white">Dividir Gastos</h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">Gerencie despesas compartilhadas, veja quem deve e organize reembolsos.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm text-gray-700 dark:text-gray-200 text-sm font-bold">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>Incluir Pessoa</span>
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-primary-hover text-white transition-colors shadow-md shadow-primary/20 text-sm font-bold">
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span>Novo Rateio</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SplitCard title="Total a Receber" value="R$ 485,00" subtext="De 3 amigos" icon="call_received" color="green" />
        <SplitCard title="Total a Pagar" value="R$ 120,50" subtext="Para 2 amigos" icon="call_made" color="orange" />
        <BalanceSummary title="Balanço Geral" value="+ R$ 364,50" status="Positivo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400">history</span>
              Atividades Recentes
            </h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors">Todos</button>
              <button className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">Não Quitados</button>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              <ActivityItem title="Jantar Japonês" details='Você pagou R$ 240,00 • Dividido com Ana e Lucas' amount="+ R$ 160,00" label="Você recebe" icon="restaurant" color="blue" />
              <ActivityItem title="Uber para Show" details='Lucas pagou R$ 45,00 • Dividido com Você' amount="- R$ 22,50" label="Você deve" icon="local_taxi" color="purple" negative />
              <ActivityItem title="Pagamento Recebido" details='Ana transferiu R$ 50,00 referente a "Cinema"' amount="R$ 50,00" label="Quitado" icon="check_circle" color="gray" quitado />
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-main dark:text-white">Saldos por Pessoa</h3>
              <button className="text-primary hover:text-primary-hover text-xs font-bold uppercase tracking-wide">Ver Todos</button>
            </div>
            <div className="space-y-4">
              <PersonBalance name="Ana Silva" details="Deve a você" amount="R$ 150,00" initials="AS" gradient="from-blue-400 to-blue-600" />
              <PersonBalance name="Lucas M." details="Deve a você" amount="R$ 335,00" initials="LM" gradient="from-orange-400 to-red-500" />
              <PersonBalance name="João Costa" details="Você deve" amount="R$ 98,00" initials="JC" gradient="from-purple-400 to-indigo-600" negative />
              <PersonBalance name="Maria Paula" details="Tudo quitado" amount="R$ 0,00" initials="MP" gradient="from-gray-400 to-gray-500" quitado />
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
              <button className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Adicionar novo amigo
              </button>
            </div>
          </div>
          <div className="mt-6 bg-gradient-to-br from-primary/10 to-transparent rounded-xl p-5 border border-primary/10">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-primary">tips_and_updates</span>
              <div>
                <h4 className="text-sm font-bold text-primary mb-1">Dica Rápida</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Você pode criar grupos para viagens ou dividir as contas da casa automaticamente todo mês.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SplitCard: React.FC<{ title: string, value: string, subtext: string, icon: string, color: 'green' | 'orange' }> = ({ title, value, subtext, icon, color }) => (
  <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${color === 'green' ? 'bg-green-50 text-primary' : 'bg-orange-50 text-orange-600'}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-xs text-gray-400 mt-2">{subtext}</p>
  </div>
);

const BalanceSummary: React.FC<{ title: string, value: string, status: string }> = ({ title, value, status }) => (
  <div className="bg-primary text-white rounded-xl p-6 shadow-lg shadow-primary/25 relative overflow-hidden group">
    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
        <span className="material-symbols-outlined">account_balance_wallet</span>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
        {status}
      </span>
    </div>
    <p className="text-primary-light text-sm font-medium mb-1 relative z-10">{title}</p>
    <p className="text-3xl font-bold relative z-10">{value}</p>
  </div>
);

const ActivityItem: React.FC<{ title: string, details: string, amount: string, label: string, icon: string, color: string, negative?: boolean, quitado?: boolean }> = ({ title, details, amount, label, icon, color, negative, quitado }) => (
  <div className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${quitado ? 'opacity-75' : ''}`}>
    <div className="flex items-center gap-4">
      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${color === 'blue' ? 'bg-blue-100 text-blue-600' : color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-text-main dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{details}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-bold ${quitado ? 'text-gray-400 line-through' : negative ? 'text-expense' : 'text-primary'}`}>{amount}</p>
    </div>
  </div>
);

const PersonBalance: React.FC<{ name: string, details: string, amount: string, initials: string, gradient: string, negative?: boolean, quitado?: boolean }> = ({ name, details, amount, initials, gradient, negative, quitado }) => (
  <div className={`flex items-center justify-between group ${quitado ? 'opacity-60' : ''}`}>
    <div className="flex items-center gap-3">
      <div className={`size-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs ${gradient}`}>
        {initials}
      </div>
      <div>
        <p className="text-sm font-medium text-text-main dark:text-white">{name}</p>
        <p className="text-xs text-gray-500">{details}</p>
      </div>
    </div>
    <span className={`text-sm font-bold ${quitado ? 'text-gray-400' : negative ? 'text-expense' : 'text-primary'}`}>{amount}</span>
  </div>
);

export default SplitExpenses;
