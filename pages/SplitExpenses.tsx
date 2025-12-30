import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import AddFriendModal from '../components/AddFriendModal';
import NewSplitModal from '../components/NewSplitModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SplitExpenses: React.FC = () => {
  const { user } = useAuth();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showNewSplit, setShowNewSplit] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [friendBalances, setFriendBalances] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Editing Friend State
  const [editingFriend, setEditingFriend] = useState<any>(null);

  // Stats
  const [stats, setStats] = useState({
    toReceive: 0,
    toPay: 0,
    totalBalance: 0
  });

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch Friends
      const { data: friendsData } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      setFriends(friendsData || []);

      // 2. Fetch all unpaid splits for calculation
      // But we will also allow filtering the activity list
      const { data: createdSplits, error: splitError } = await supabase
        .from('split_participants')
        .select(`
                *,
                split_expenses (
                    description,
                    amount,
                    date,
                    created_by,
                    billing_date,
                    group_id,
                    installment_number,
                    total_installments
                ),
                friends (
                    id,
                    name
                )
            `)
        .eq('is_paid', false);

      if (splitError) throw splitError;

      const allUnpaid = createdSplits || [];

      // Filter activities based on selected month/year
      const filteredActivities = allUnpaid.filter(item => {
        const referenceDate = item.split_expenses?.billing_date || item.split_expenses?.date;
        const d = new Date(referenceDate + (referenceDate.includes('T') ? '' : 'T00:00:00'));
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });

      // Calculate totals (Balance should probably be global unpaid, but filter says "Monthly references")
      // User requested "filtro de mês referente aos valores de dividir gastos"
      // Let's calculate stats based on the FILTERED selection to show how much is pending for THAT month specifically

      let toReceive = 0;
      const balancesMap: { [key: string]: { name: string, amount: number } } = {};

      filteredActivities.forEach((item: any) => {
        const amount = Number(item.amount_owed);
        toReceive += amount;

        const friendId = item.friends?.id;
        const friendName = item.friends?.name;

        if (friendId && friendName) {
          if (!balancesMap[friendId]) {
            balancesMap[friendId] = { name: friendName, amount: 0 };
          }
          balancesMap[friendId].amount += amount;
        }
      });

      setStats({
        toReceive,
        toPay: 0,
        totalBalance: toReceive
      });

      setRecentActivities(filteredActivities);
      setFriendBalances(Object.values(balancesMap));

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, selectedMonth, selectedYear]);

  const handleMarkPaid = async (item: any) => {
    try {
      const { error } = await supabase
        .from('split_participants')
        .update({ is_paid: true })
        .eq('id', item.id);

      if (error) throw error;
      fetchData(); // Refresh
    } catch (err) {
      console.error("Error marking paid:", err);
    }
  };

  const handleDeleteSplit = async (item: any) => {
    let mode: 'only' | 'all' = 'only';
    if (item.split_expenses?.group_id) {
      const confirmAll = confirm('Este rateio faz parte de um parcelamento. Deseja excluir apenas este mês (Cancelar) ou este e todos os futuros (OK)?');
      mode = confirmAll ? 'all' : 'only';
    } else {
      if (!confirm('Tem certeza que deseja excluir este rateio?')) return;
    }

    try {
      if (mode === 'all' && item.split_expenses?.group_id) {
        // Find all expenses in this group from this installment onwards
        const { data: relatedExpenses } = await supabase
          .from('split_expenses')
          .select('id')
          .eq('group_id', item.split_expenses.group_id)
          .gte('installment_number', item.split_expenses.installment_number);

        const ids = relatedExpenses?.map(e => e.id) || [];
        if (ids.length > 0) {
          // Delete participants first due to FK or Cascaded
          await supabase.from('split_participants').delete().in('split_expense_id', ids);
          await supabase.from('split_expenses').delete().in('id', ids);
        }
      } else {
        await supabase.from('split_participants').delete().eq('id', item.id);
        await supabase.from('split_expenses').delete().eq('id', item.split_expense_id);
      }
      fetchData();
    } catch (err: any) {
      alert('Erro ao excluir rateio: ' + err.message);
    }
  };

  const handleDeleteFriend = async (friendId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pessoa? Isso não excluirá os rateios existentes, mas ela não aparecerá mais na sua lista.')) return;

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendId);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Erro ao excluir amigo: ' + err.message);
    }
  };

  const handleEditFriend = async (friend: any) => {
    const newName = prompt('Novo nome para ' + friend.name + ':', friend.name);
    if (!newName || newName === friend.name) return;

    try {
      const { error } = await supabase
        .from('friends')
        .update({ name: newName })
        .eq('id', friend.id);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Erro ao editar amigo: ' + err.message);
    }
  };

  const handleExportPDF = (friendFilter?: any) => {
    const doc = new jsPDF();
    const monthName = months[selectedMonth];
    const reportTitle = friendFilter
      ? `Relatório de Rateio - ${friendFilter.name} (${monthName} ${selectedYear})`
      : `Relatório de Rateio - Geral (${monthName} ${selectedYear})`;

    doc.setFontSize(22);
    doc.setTextColor(26, 96, 32); // Primary green
    doc.text(reportTitle, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    const activitiesToExport = friendFilter
      ? recentActivities.filter(act => act.friends?.id === friendFilter.id)
      : recentActivities;

    const totalToReceive = activitiesToExport.reduce((acc, act) => acc + Number(act.amount_owed), 0);

    autoTable(doc, {
      startY: 40,
      head: [['Descrição', 'Pessoa', 'Valor', 'Data Lançamento', 'Referência']],
      body: activitiesToExport.map(act => [
        act.split_expenses?.description || 'Despesa',
        act.friends?.name || '-',
        `R$ ${Number(act.amount_owed).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        act.split_expenses?.date ? new Date(act.split_expenses.date).toLocaleDateString('pt-BR') : '-',
        act.split_expenses?.billing_date ? new Date(act.split_expenses.billing_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [26, 96, 32] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Total a Receber: R$ ${totalToReceive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, finalY);

    const fileName = friendFilter
      ? `Relatorio_Rateio_${friendFilter.name.replace(/\s+/g, '_')}_${monthName}_${selectedYear}.pdf`
      : `Relatorio_Rateio_Geral_${monthName}_${selectedYear}.pdf`;

    doc.save(fileName);
  };

  return (
    <div className="animate-fade-in w-full max-w-[1440px] mx-auto px-4 md:px-10 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-main dark:text-white">Dividir Gastos</h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">Gerencie despesas compartilhadas, veja quem deve e organize reembolsos.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddFriend(true)}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm text-gray-700 dark:text-gray-200 text-sm font-bold"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>Incluir Pessoa</span>
          </button>
          <button
            onClick={() => setShowNewSplit(true)}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-primary-hover text-white transition-colors shadow-md shadow-primary/20 text-sm font-bold"
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span>Novo Rateio</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SplitCard title="Total a Receber" value={`R$ ${stats.toReceive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} subtext={`Referente a ${months[selectedMonth]}`} icon="call_received" color="green" />
        <SplitCard title="Total a Pagar" value={`R$ ${stats.toPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} subtext="Você deve" icon="call_made" color="orange" />
        <BalanceSummary title="Balanço (Mês)" value={`+ R$ ${stats.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} status="Positivo" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 p-4 mb-8 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-400">calendar_month</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-text-main dark:text-white cursor-pointer"
          >
            {months.map((m, i) => <option key={i} value={i} className="bg-white dark:bg-surface-dark">{m}</option>)}
          </select>
        </div>
        <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden sm:block"></div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-transparent border-none focus:ring-0 text-sm font-bold text-text-main dark:text-white cursor-pointer"
        >
          {years.map(y => <option key={y} value={y} className="bg-white dark:bg-surface-dark">{y}</option>)}
        </select>
        <div className="ml-auto">
          <button
            onClick={() => handleExportPDF()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-red-200 dark:border-red-500/20"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Exportar Geral
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400">history</span>
              Contas em Aberto ({months[selectedMonth]})
            </h3>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <div className="p-6 text-center text-gray-500">Carregando...</div>
              ) : recentActivities.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Nenhuma conta em aberto para este período.</div>
              ) : (
                recentActivities.map((act) => (
                  <ActivityItem
                    key={act.id}
                    title={act.split_expenses?.description || 'Despesa'}
                    details={`Dividido com ${act.friends?.name}`}
                    amount={`R$ ${Number(act.amount_owed).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    label="Você recebe"
                    icon="receipt_long"
                    color="blue"
                    billingDate={act.split_expenses?.billing_date}
                    purchaseDate={act.split_expenses?.date}
                    onMarkPaid={() => handleMarkPaid(act)}
                    onDelete={() => handleDeleteSplit(act)}
                  />
                ))
              )}
            </div>
          </div>

          {/* People List Management */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 p-4 flex flex-col gap-4 shadow-sm">
            <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400">group</span>
              Pessoas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {f.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-text-main dark:text-white">{f.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditFriend(f)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-primary">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => handleDeleteFriend(f.id)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-expense">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
              {friends.length === 0 && <p className="text-xs text-gray-500 italic p-2">Nenhuma pessoa incluída.</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-main dark:text-white">Saldos por Pessoa</h3>
            </div>
            <div className="space-y-4">
              {friendBalances.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum saldo pendente para {months[selectedMonth]}.</p>
              ) : (
                friendBalances.map((fb, idx) => (
                  <PersonBalance
                    key={idx}
                    name={fb.name}
                    details="Deve a você"
                    amount={`R$ ${fb.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    initials={fb.name.substring(0, 2).toUpperCase()}
                    gradient="from-blue-400 to-blue-600"
                    onExport={() => handleExportPDF({ id: Object.keys(recentActivities.reduce((acc, act) => { if (act.friends?.name === fb.name) acc[act.friends.id] = true; return acc; }, {} as any))[0], name: fb.name })}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddFriend && <AddFriendModal onClose={() => setShowAddFriend(false)} onSuccess={fetchData} />}
      {showNewSplit && <NewSplitModal onClose={() => setShowNewSplit(false)} onSuccess={fetchData} />}
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

const ActivityItem: React.FC<{ title: string, details: string, amount: string, label: string, icon: string, color: string, billingDate?: string, purchaseDate?: string, onMarkPaid?: () => void, onDelete?: () => void }> = ({ title, details, amount, label, icon, color, billingDate, purchaseDate, onMarkPaid, onDelete }) => (
  <div className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
    <div className="flex items-center gap-4">
      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-text-main dark:text-white">{title}</p>
          {billingDate && purchaseDate && new Date(billingDate + 'T00:00:00').getMonth() !== new Date(purchaseDate + 'T00:00:00').getMonth() && (
            <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded border border-orange-100 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">calendar_month</span>
              Fatura Anterior
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{details}</p>
      </div>
    </div>
    <div className="text-right flex items-center gap-4">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-primary">{amount}</p>
      </div>
      <div className="flex gap-2">
        {onMarkPaid && (
          <button onClick={onMarkPaid} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 font-bold" title="Marcar como Pago">
            Quitado
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="text-xs bg-red-50 text-red-500 p-1 rounded hover:bg-red-100" title="Excluir">
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        )}
      </div>
    </div>
  </div>
);

const PersonBalance: React.FC<{ name: string, details: string, amount: string, initials: string, gradient: string, onExport?: () => void }> = ({ name, details, amount, initials, gradient, onExport }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-3">
      <div className={`size-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs ${gradient}`}>
        {initials}
      </div>
      <div>
        <p className="text-sm font-medium text-text-main dark:text-white">{name}</p>
        <p className="text-xs text-gray-500">{details}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-primary">{amount}</span>
      {onExport && (
        <button
          onClick={onExport}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
          title="Exportar PDF para esta pessoa"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
        </button>
      )}
    </div>
  </div>
);

export default SplitExpenses;
