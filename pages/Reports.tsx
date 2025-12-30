
import React from 'react';

const Reports: React.FC = () => {
  return (
    <div className="animate-fade-in w-full max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-6 md:gap-8">
      {/* Page Heading & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-text-secondary text-sm font-medium mb-1">
            <span>Home</span>
            <span className="material-symbols-outlined text-[10px]">arrow_forward_ios</span>
            <span className="text-primary">Relatórios</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-text-main dark:text-white tracking-tight">Relatórios Financeiros</h2>
          <p className="text-text-secondary dark:text-gray-400 mt-1 text-base">Análise detalhada de suas finanças de Janeiro a Dezembro 2023.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 shadow-sm">
            <span className="material-symbols-outlined text-gray-400 text-xl mr-2">calendar_month</span>
            <select className="bg-transparent border-none text-sm font-medium text-text-main dark:text-white focus:ring-0 p-0 pr-6 cursor-pointer outline-none">
              <option>Ano de 2023</option>
              <option>Ano de 2022</option>
              <option>Últimos 6 meses</option>
            </select>
          </div>
          <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-md shadow-primary/20 transition-all group">
            <span className="material-symbols-outlined text-lg group-hover:animate-bounce">download</span>
            Exportar relatório
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <ReportSummary title="Total Anual" value="R$ 145.200,00" trend="+12%" icon="payments" color="primary" />
        <ReportSummary title="Média Mensal" value="R$ 12.100,00" trend="estável" icon="calendar_today" color="gray" />
        <ReportSummary title="Economia Projetada" value="R$ 24.500,00" trend="+5%" icon="savings" color="success" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-text-main dark:text-white">Evolução Financeira Mensal</h3>
              <p className="text-sm text-text-secondary">Receitas vs. Despesas</p>
            </div>
            <button className="text-primary hover:bg-surface-green p-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div className="flex-1 min-h-[300px] w-full relative">
            <div className="absolute inset-0 flex items-end justify-between px-2 gap-2 md:gap-4 pb-6">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 pr-4">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>)}
              </div>
              <ReportBar primaryH="40%" secondaryH="25%" month="Jan" />
              <ReportBar primaryH="55%" secondaryH="30%" month="Fev" />
              <ReportBar primaryH="45%" secondaryH="35%" month="Mar" />
              <ReportBar primaryH="60%" secondaryH="40%" month="Abr" />
              <ReportBar primaryH="75%" secondaryH="45%" month="Mai" />
              <ReportBar primaryH="65%" secondaryH="38%" month="Jun" />
              <ReportBar primaryH="80%" secondaryH="50%" month="Jul" hideMobile />
              <ReportBar primaryH="70%" secondaryH="45%" month="Ago" hideMobile />
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4 justify-center">
            <LegendItem color="primary" text="Receitas" />
            <LegendItem color="secondary/40" text="Despesas" />
          </div>
        </div>

        {/* Category Pie Chart Simulation */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-text-main dark:text-white">Despesas por Categoria</h3>
            <p className="text-sm text-text-secondary">Onde seu dinheiro foi gasto</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[240px]">
            <div className="relative h-48 w-48">
              <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="40" stroke="#e9f1ea" strokeWidth="12"></circle>
                <circle cx="50" cy="50" fill="none" r="40" stroke="#1a6020" strokeDasharray="100 251.2" strokeDashoffset="0" strokeWidth="12"></circle>
                <circle cx="50" cy="50" fill="none" r="40" stroke="#4CAF50" strokeDasharray="75 251.2" strokeDashoffset="-100" strokeWidth="12"></circle>
                <circle cx="50" cy="50" fill="none" r="40" stroke="#81c784" strokeDasharray="50 251.2" strokeDashoffset="-175" strokeWidth="12"></circle>
                <circle cx="50" cy="50" fill="none" r="40" stroke="#c8e6c9" strokeDasharray="25 251.2" strokeDashoffset="-225" strokeWidth="12"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-text-main dark:text-white">R$ 82k</span>
                <span className="text-xs text-text-secondary">Total</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <CategoryLegend color="#1a6020" name="Moradia" percent="40%" />
            <CategoryLegend color="#4CAF50" name="Alimentação" percent="30%" />
            <CategoryLegend color="#81c784" name="Transporte" percent="20%" />
            <CategoryLegend color="#c8e6c9" name="Lazer" percent="10%" />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-surface-green/30 dark:bg-surface-green/5">
          <h3 className="font-bold text-text-main dark:text-white">Últimos Relatórios Gerados</h3>
          <a className="text-sm text-primary font-semibold hover:underline" href="#">Ver todos</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-6 py-3 font-semibold">Nome do Arquivo</th>
                <th className="px-6 py-3 font-semibold">Período</th>
                <th className="px-6 py-3 font-semibold">Data de Criação</th>
                <th className="px-6 py-3 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              <ReportFileRow name="Relatorio_Anual_2023.pdf" period="Jan 2023 - Dez 2023" date="15 Jan, 2024" type="pdf" />
              <ReportFileRow name="Balanco_Q4_2023.csv" period="Out 2023 - Dez 2023" date="05 Jan, 2024" type="csv" />
              <ReportFileRow name="Investimentos_2023.pdf" period="Jan 2023 - Dez 2023" date="02 Jan, 2024" type="pdf" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ReportSummary: React.FC<{ title: string, value: string, trend: string, icon: string, color: string }> = ({ title, value, trend, icon, color }) => {
  const iconColor = color === 'primary' ? 'text-primary bg-surface-green' : color === 'success' ? 'text-secondary bg-green-50' : 'text-gray-500 bg-gray-100';
  return (
    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 flex flex-col gap-4 relative overflow-hidden group">
      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <span className="material-symbols-outlined text-8xl">{icon}</span>
      </div>
      <div className="flex items-start justify-between z-10">
        <div className="flex flex-col gap-1">
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${iconColor}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 text-sm font-medium z-10 ${color === 'primary' ? 'text-primary' : color === 'success' ? 'text-secondary' : 'text-text-secondary'}`}>
        <span className={`px-1.5 py-0.5 rounded text-xs flex items-center ${color === 'primary' ? 'bg-primary/10' : color === 'success' ? 'bg-secondary/10' : 'bg-gray-100'}`}>
          <span className="material-symbols-outlined text-sm mr-0.5">{trend.includes('+') ? 'trending_up' : 'remove'}</span>
          {trend}
        </span>
        <span className="text-text-secondary text-xs font-normal">{trend === 'estável' ? 'estável' : 'vs período anterior'}</span>
      </div>
    </div>
  );
};

const ReportBar: React.FC<{ primaryH: string, secondaryH: string, month: string, hideMobile?: boolean }> = ({ primaryH, secondaryH, month, hideMobile }) => (
  <div className={`flex flex-col items-center gap-2 group w-full h-full justify-end ${hideMobile ? 'hidden sm:flex' : 'flex'}`}>
    <div className="w-full max-w-[24px] rounded-t bg-primary group-hover:opacity-80 transition-opacity relative" style={{ height: primaryH }}></div>
    <div className="w-full max-w-[24px] rounded-t bg-secondary/40 group-hover:opacity-80 transition-opacity" style={{ height: secondaryH }}></div>
    <span className="text-xs font-medium text-text-secondary mt-2 absolute -bottom-1">{month}</span>
  </div>
);

const LegendItem: React.FC<{ color: string, text: string }> = ({ color, text }) => (
  <div className="flex items-center gap-2">
    <span className={`w-3 h-3 rounded-full bg-${color}`}></span>
    <span className="text-sm text-text-secondary">{text}</span>
  </div>
);

const CategoryLegend: React.FC<{ color: string, name: string, percent: string }> = ({ color, name, percent }) => (
  <div className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
    <span className="text-sm font-medium text-text-main dark:text-gray-300">{name}</span>
    <span className="text-xs text-text-secondary ml-auto">{percent}</span>
  </div>
);

const ReportFileRow: React.FC<{ name: string, period: string, date: string, type: string }> = ({ name, period, date, type }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-[#233b24] transition-colors">
    <td className="px-6 py-4 font-medium text-text-main dark:text-white flex items-center gap-2">
      <span className={`material-symbols-outlined ${type === 'pdf' ? 'text-red-500' : 'text-green-600'}`}>
        {type === 'pdf' ? 'picture_as_pdf' : 'description'}
      </span>
      {name}
    </td>
    <td className="px-6 py-4 text-text-secondary">{period}</td>
    <td className="px-6 py-4 text-text-secondary">{date}</td>
    <td className="px-6 py-4 text-right">
      <button className="text-primary hover:text-primary-hover font-medium hover:underline">Baixar</button>
    </td>
  </tr>
);

export default Reports;
