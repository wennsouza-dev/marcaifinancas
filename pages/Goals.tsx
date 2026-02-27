import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

interface Goal {
    id: string;
    title: string;
    target_amount: number;
    current_amount: number;
    deadline: string | null;
    emoji: string;
    created_at: string;
}

const EMOJIS = ['🎯', '✈️', '🏠', '🚗', '💍', '📚', '💻', '🎓', '🏋️', '🌴', '💰', '🎁'];

const MILESTONE_BADGES = [
    { at: 100, label: 'Meta Alcançada! 🏆', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { at: 75, label: '75% lá! 🚀', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    { at: 50, label: 'Metade do caminho 💪', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { at: 25, label: 'Começou bem! ⭐', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
];

const getMilestoneBadge = (percent: number) => {
    return MILESTONE_BADGES.find(b => percent >= b.at) || null;
};

const Goals: React.FC = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
    const [contributeAmount, setContributeAmount] = useState('');

    // New goal form state
    const [newTitle, setNewTitle] = useState('');
    const [newTarget, setNewTarget] = useState('');
    const [newDeadline, setNewDeadline] = useState('');
    const [newEmoji, setNewEmoji] = useState('🎯');
    const [saving, setSaving] = useState(false);

    const fetchGoals = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('financial_goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (!error) setGoals(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchGoals(); }, [user]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTitle || !newTarget) return;
        setSaving(true);
        const { error } = await supabase.from('financial_goals').insert([{
            user_id: user.id,
            title: newTitle,
            target_amount: parseFloat(newTarget),
            current_amount: 0,
            deadline: newDeadline || null,
            emoji: newEmoji,
        }]);
        if (!error) {
            setNewTitle(''); setNewTarget(''); setNewDeadline(''); setNewEmoji('🎯');
            setShowForm(false);
            fetchGoals();
        }
        setSaving(false);
    };

    const handleContribute = async (goalId: string) => {
        const amount = parseFloat(contributeAmount);
        if (!amount || amount <= 0) return;
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        const newAmount = Math.min(goal.current_amount + amount, goal.target_amount);
        const { error } = await supabase
            .from('financial_goals')
            .update({ current_amount: newAmount })
            .eq('id', goalId);
        if (!error) {
            setContributeGoalId(null);
            setContributeAmount('');
            fetchGoals();
        }
    };

    const handleDelete = async (goalId: string) => {
        if (!window.confirm('Remover esta meta?')) return;
        await supabase.from('financial_goals').delete().eq('id', goalId);
        fetchGoals();
    };

    const formatCurrency = (v: number) =>
        v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const getDaysLeft = (deadline: string) => {
        const diff = new Date(deadline + 'T00:00:00').getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-text-main dark:text-white tracking-tight">Metas Financeiras</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Defina e acompanhe seus objetivos.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-primary text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-hover transition-all"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Nova Meta
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/10 shadow-xl p-6 mb-8 animate-scale-up">
                    <h2 className="text-lg font-bold text-text-main dark:text-white mb-4">Nova Meta</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        {/* Emoji Picker */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ícone</label>
                            <div className="flex flex-wrap gap-2">
                                {EMOJIS.map(e => (
                                    <button
                                        key={e} type="button"
                                        onClick={() => setNewEmoji(e)}
                                        className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${newEmoji === e ? 'border-primary bg-primary/10 scale-110' : 'border-transparent hover:border-gray-300'}`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Título da Meta</label>
                            <input
                                value={newTitle} onChange={e => setNewTitle(e.target.value)} required
                                placeholder="Ex: Viagem para Europa, Notebook novo..."
                                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Valor Alvo (R$)</label>
                                <input
                                    type="number" step="0.01" value={newTarget} onChange={e => setNewTarget(e.target.value)} required
                                    placeholder="0,00"
                                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold text-text-main dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Prazo (opcional)</label>
                                <input
                                    type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)}
                                className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={saving}
                                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/25 transition-all disabled:opacity-50">
                                {saving ? 'Salvando...' : 'Criar Meta'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Goals List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : goals.length === 0 ? (
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
                    <div className="text-5xl mb-4">🎯</div>
                    <p className="text-lg font-bold text-text-main dark:text-white mb-1">Nenhuma meta ainda</p>
                    <p className="text-gray-500 text-sm">Crie sua primeira meta financeira e comece a economizar!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {goals.map(goal => {
                        const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
                        const badge = getMilestoneBadge(pct);
                        const daysLeft = goal.deadline ? getDaysLeft(goal.deadline) : null;
                        const isComplete = pct >= 100;

                        return (
                            <div key={goal.id} className={`bg-white dark:bg-surface-dark rounded-2xl border shadow-sm hover:shadow-md transition-shadow ${isComplete ? 'border-yellow-200' : 'border-gray-100 dark:border-white/10'}`}>
                                <div className="p-5">
                                    {/* Top Row */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${isComplete ? 'bg-yellow-50' : 'bg-gray-50 dark:bg-white/5'}`}>
                                                {goal.emoji}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-main dark:text-white">{goal.title}</h3>
                                                <p className="text-xs text-gray-400">
                                                    {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(goal.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                                        </button>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-bold text-gray-500">{Math.round(pct)}% concluído</span>
                                            {daysLeft !== null && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${daysLeft < 0 ? 'bg-red-100 text-red-700' : daysLeft <= 30 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {daysLeft < 0 ? 'Prazo vencido' : `${daysLeft}d restantes`}
                                                </span>
                                            )}
                                        </div>
                                        <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${isComplete ? 'bg-yellow-400' : pct >= 75 ? 'bg-purple-500' : pct >= 50 ? 'bg-blue-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Milestone Badge */}
                                    {badge && (
                                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold mb-3 ${badge.color}`}>
                                            {badge.label}
                                        </div>
                                    )}

                                    {/* Contribute Section */}
                                    {!isComplete && (
                                        contributeGoalId === goal.id ? (
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    type="number" step="0.01" value={contributeAmount}
                                                    onChange={e => setContributeAmount(e.target.value)}
                                                    placeholder="0,00"
                                                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                                <button onClick={() => handleContribute(goal.id)}
                                                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-hover transition-colors">
                                                    Adicionar
                                                </button>
                                                <button onClick={() => { setContributeGoalId(null); setContributeAmount(''); }}
                                                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setContributeGoalId(goal.id)}
                                                className="w-full mt-1 py-2 border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-sm font-bold rounded-xl hover:border-primary hover:text-primary transition-colors"
                                            >
                                                + Adicionar valor
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Goals;
