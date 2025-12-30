
import React from 'react';

const Accounting: React.FC = () => {
  return (
    <div className="animate-fade-in flex flex-col md:flex-row h-full">
      {/* Sidebar (Optional for this view if we want to follow the screenshot exactly) */}
      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-8 bg-[#f9fbf9] dark:bg-background-dark">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-8 w-full">
          {/* Title Area */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
             <div>
                <h2 className="text-2xl font-bold text-text-main dark:text-white">Meu Escritório</h2>
                <p className="text-sm text-text-secondary">Gestão centralizada de clientes e obrigações</p>
             </div>
             <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md shadow-primary/30">
                <span className="material-symbols-outlined text-lg">add</span>
                <span>Novo Cliente</span>
              </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard title="Clientes Ativos" value="124" trend="+4 esse mês" icon="group" color="primary" />
            <SummaryCard title="Docs Pendentes" value="18" trend="Ação necessária" icon="pending_actions" color="warning" />
            <SummaryCard title="Faturamento (Mês)" value="R$ 42.500" trend="Previsto: R$ 45.000" icon="payments" color="info" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Clients Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text-main dark:text-white tracking-tight">Carteira de Clientes</h3>
                  <a className="text-sm text-primary font-medium hover:underline" href="#">Ver todos</a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ClientCard name="Tech Solutions Ltda" initials="TS" type="PJ" info="CNPJ: 12.345.678/0001-90" status="Em dia" progress={85} progressText="85% docs mensais" color="blue" />
                  <ClientCard name="João Silva" initials="JS" type="PF" info="IRPF 2024" status="Pendente" progress={40} progressText="Aguardando documentos" color="purple" statusColor="orange" />
                  <ClientCard name="Marketing Digital S.A." initials="MD" type="PJ" info="Simples Nacional" status="Em dia" progress={100} progressText="Completo" color="teal" />
                </div>
              </section>

              {/* Docs Section */}
              <section>
                <h3 className="text-lg font-bold text-text-main dark:text-white mb-4 tracking-tight">Gestão de Documentos</h3>
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                    <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 transition-colors group">
                      <div className="w-12 h-12 bg-white dark:bg-background-dark rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary text-2xl">cloud_upload</span>
                      </div>
                      <p className="text-sm font-medium text-text-main dark:text-white">Arraste notas fiscais ou comprovantes aqui</p>
                      <p className="text-xs text-text-secondary mt-1">Suporta PDF, PNG, JPG até 10MB</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-text-secondary uppercase bg-gray-50 dark:bg-white/5 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 font-medium">Nome do Arquivo</th>
                          <th className="px-6 py-3 font-medium hidden sm:table-cell">Cliente</th>
                          <th className="px-6 py-3 font-medium">Data</th>
                          <th className="px-6 py-3 font-medium text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        <FileRow name="NF-2023-001.pdf" client="Tech Solutions" date="Hoje, 10:30" icon="picture_as_pdf" iconColor="text-red-500" />
                        <FileRow name="Recibo_Pagamento.jpg" client="João Silva" date="Ontem, 16:45" icon="image" iconColor="text-blue-500" />
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 text-center">
                    <button className="text-sm text-primary font-medium hover:underline">Ver todos os documentos</button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column Obligations */}
            <div className="lg:col-span-1">
              <section className="h-full">
                <h3 className="text-lg font-bold text-text-main dark:text-white mb-4 tracking-tight">Obrigações do Mês</h3>
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-6 flex flex-col h-fit sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Outubro 2023</h4>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-lg">calendar_today</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <ObligationItem text="Fechamento Folha Pagamento" status="Concluído em 05/10" done />
                    <ObligationItem text="Envio de DAS (Simples)" status="Vence Hoje" subtext="Tech Solutions" highlight />
                    <ObligationItem text="Conciliação Bancária" status="Pendente - Todos os clientes" />
                    <ObligationItem text="Envio DCTFWeb" status="Prazo: 15/10" />
                  </div>
                  <div className="mt-8 pt-4 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
                      <span>Progresso Mensal</span>
                      <span className="font-bold text-text-main dark:text-white">25%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ title: string, value: string, trend: string, icon: string, color: string }> = ({ title, value, trend, icon, color }) => {
  const iconColor = color === 'primary' ? 'text-primary bg-green-50' : color === 'warning' ? 'text-orange-600 bg-orange-50' : 'text-blue-600 bg-blue-50';
  return (
    <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-text-secondary text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-text-main dark:text-white mt-1">{value}</h3>
        <p className={`text-xs flex items-center gap-1 mt-2 font-medium ${color === 'primary' ? 'text-primary' : color === 'warning' ? 'text-orange-600' : 'text-text-secondary'}`}>
          <span className="material-symbols-outlined text-sm">{color === 'primary' ? 'trending_up' : color === 'warning' ? 'warning' : 'info'}</span>
          {trend}
        </p>
      </div>
      <div className={`p-2 rounded-lg ${iconColor}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
  );
};

const ClientCard: React.FC<{ name: string, initials: string, type: string, info: string, status: string, progress: number, progressText: string, color: string, statusColor?: string }> = ({ name, initials, type, info, status, progress, progressText, color, statusColor = 'green' }) => (
  <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
    <div className="flex justify-between items-start mb-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-${color}-100 text-${color}-700`}>
        {initials}
      </div>
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusColor === 'green' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
        {status}
      </span>
    </div>
    <h4 className="font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{name}</h4>
    <div className="flex items-center gap-2 mt-1 mb-3">
      <span className="text-xs text-text-secondary bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{type}</span>
      <span className="text-xs text-text-secondary">{info}</span>
    </div>
    <div className="w-full bg-gray-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${statusColor === 'green' ? 'bg-primary' : 'bg-orange-400'}`} style={{ width: `${progress}%` }}></div>
    </div>
    <p className="text-[10px] text-text-secondary mt-1 text-right">{progressText}</p>
  </div>
);

const FileRow: React.FC<{ name: string, client: string, date: string, icon: string, iconColor: string }> = ({ name, client, date, icon, iconColor }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
    <td className="px-6 py-3 flex items-center gap-3">
      <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
      <span className="text-text-main dark:text-white font-medium">{name}</span>
    </td>
    <td className="px-6 py-3 text-text-secondary hidden sm:table-cell">{client}</td>
    <td className="px-6 py-3 text-text-secondary">{date}</td>
    <td className="px-6 py-3 text-right">
      <button className="text-text-secondary hover:text-primary"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
    </td>
  </tr>
);

const ObligationItem: React.FC<{ text: string, status: string, done?: boolean, highlight?: boolean, subtext?: string }> = ({ text, status, done, highlight, subtext }) => (
  <div className="flex items-start gap-3 group">
    <div className="relative flex items-center mt-0.5">
      <input checked={done} readOnly className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/50 cursor-pointer" type="checkbox"/>
    </div>
    <div className="flex-1">
      <p className={`text-sm font-medium ${done ? 'text-text-main dark:text-gray-400 line-through opacity-60' : 'text-text-main dark:text-white group-hover:text-primary transition-colors'}`}>{text}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <p className={`text-xs font-medium ${highlight ? 'bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold' : 'text-text-secondary'}`}>{status}</p>
        {subtext && <span className="text-xs text-text-secondary">{subtext}</span>}
      </div>
    </div>
  </div>
);

export default Accounting;
