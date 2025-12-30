
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import AddFriendModal from '../components/AddFriendModal';
import NewSplitModal from '../components/NewSplitModal';

const SplitExpenses: React.FC = () => {
  const { user } = useAuth();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showNewSplit, setShowNewSplit] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [friendBalances, setFriendBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    toReceive: 0,
    toPay: 0, // In this simple model, user is always Creator, so primarily receives. But we can expand structure later.
    totalBalance: 0
  });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch splits where user is the creator (amount friends owe user)
      const { data: createdSplits, error: splitError } = await supabase
        .from('split_participants')
        .select(`
                *,
                split_expenses (
                    description,
                    amount,
                    date,
                    created_by
                ),
                friends (
                    id,
                    name
                )
            `)
        .eq('is_paid', false);

      if (splitError) throw splitError;

      const activities = createdSplits || [];

      // Calculate totals
      let toReceive = 0;
      const balancesMap: { [key: string]: { name: string, amount: number } } = {};

      activities.forEach((item: any) => {
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

      // Current model: User creates split -> Friends Owe User.
      // User is "Creator". Friendship is uni-directional in this simple DB for now (User -> Friend Name).
      // So User mainly Recceives. "To Pay" would be if we had full bi-directional accounts.

      setStats({
        toReceive,
        toPay: 0,
        totalBalance: toReceive
      });

      setRecentActivities(activities);
      setFriendBalances(Object.values(balancesMap));

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleMarkPaid = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('split_participants')
        .update({ is_paid: true })
        .eq('id', participantId);

      if (error) throw error;
      fetchData(); // Refresh
    } catch (err) {
      console.error("Error marking paid:", err);
    }
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
        <SplitCard title="Total a Receber" value={`R$ ${stats.toReceive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} subtext="De amigos" icon="call_received" color="green" />
        <SplitCard title="Total a Pagar" value={`R$ ${stats.toPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} subtext="Você deve" icon="call_made" color="orange" />
        <BalanceSummary title="Balanço Geral" value={`+ R$ ${stats.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} status="Positivo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400">history</span>
              Contas em Aberto
            </h3>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <div className="p-6 text-center text-gray-500">Carregando...</div>
              ) : recentActivities.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Nenhuma conta em aberto.</div>
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
                    onMarkPaid={() => handleMarkPaid(act.id)}
                  />
                ))
              )}
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
                <p className="text-sm text-gray-500">Nenhum saldo pendente.</p>
              ) : (
                friendBalances.map((fb, idx) => (
                  <PersonBalance
                    key={idx}
                    name={fb.name}
                    details="Deve a você"
                    amount={`R$ ${fb.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    initials={fb.name.substring(0, 2).toUpperCase()}
                    gradient="from-blue-400 to-blue-600"
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

const ActivityItem: React.FC<{ title: string, details: string, amount: string, label: string, icon: string, color: string, onMarkPaid?: () => void }> = ({ title, details, amount, label, icon, color, onMarkPaid }) => (
  <div className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
    <div className="flex items-center gap-4">
      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-text-main dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{details}</p>
      </div>
    </div>
    <div className="text-right flex items-center gap-4">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-primary">{amount}</p>
      </div>
      {onMarkPaid && (
        <button onClick={onMarkPaid} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200" title="Marcar como Pago">
          Quitado
        </button>
      )}
    </div>
  </div>
);

const PersonBalance: React.FC<{ name: string, details: string, amount: string, initials: string, gradient: string }> = ({ name, details, amount, initials, gradient }) => (
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
    <span className="text-sm font-bold text-primary">{amount}</span>
  </div>
);

export default SplitExpenses;
