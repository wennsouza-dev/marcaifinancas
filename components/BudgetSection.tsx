import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const EXPENSE_CATEGORIES = ['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Eletrônicos', 'Saúde', 'Educação', 'Outros'];

interface Budget { id?: string; category: string; amount: number; }
interface Props { currentExpenses: Record<string, number>; month: number; year: number; }

const BudgetSection: React.FC<Props> = ({ currentExpenses, month, year }) => {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [editingCat, setEditingCat] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchBudgets = async () => {
        if (!user) return;
        const { data } = await supabase.from('monthly_budgets').select('*').eq('user_id', user.id);
        if (data) setBudgets(data);
    };

    useEffect(() => { fetchBudgets(); }, [user]);

    const handleSave = async (category: string) => {
        if (!user || !editValue) return;
        setSaving(true);
        const amount = parseFloat(editValue.replace(',', '.'));
        const existing = budgets.find(b => b.category === category);
        if (existing?.id) {
            await supabase.from('monthly_budgets').update({ amount }).eq('id', existing.id);
        } else {
            await supabase.from('monthly_budgets').insert({ user_id: user.id, category, amount });
        }
        await fetchBudgets();
        setEditingCat(null);
        setSaving(false);
    };

    const handleDelete = async (category: string) => {
        const existing = budgets.find(b => b.category === category);
        if (!existing?.id) return;
        await supabase.from('monthly_budgets').delete().eq('id', existing.id);
        await fetchBudgets();
    };

    const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const categoriesWithBudget = EXPENSE_CATEGORIES.filter(cat =>
        budgets.some(b => b.category === cat) || currentExpenses[cat] > 0
    );

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-base font-bold text-text-main dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-orange-500">savings</span>
                        Orçamento Mensal — {MONTH_NAMES[month]}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Defina limites de gasto por categoria</p>
                </div>
                <button
                    onClick={() => { setEditingCat('new'); setEditValue(''); }}
                    className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-colors"
                >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Definir Limite
                </button>
            </div>

            {/* Add / Edit Form */}
            {editingCat !== null && (
                <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-500/20">
                    <p className="text-xs font-bold text-orange-700 mb-3">
                        {editingCat === 'new' ? 'Nova Categoria com Limite' : `Editar: ${editingCat}`}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {editingCat === 'new' && (
                            <select
                                className="flex-1 min-w-[130px] px-3 py-2 bg-white dark:bg-black/20 border border-orange-200 rounded-xl text-sm focus:outline-none"
                                onChange={e => setEditingCat(e.target.value)}
                                defaultValue=""
                            >
                                <option value="" disabled>Selecionar categoria</option>
                                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )}
                        <div className="flex items-center gap-1 flex-1 min-w-[130px] bg-white dark:bg-black/20 border border-orange-200 rounded-xl px-3">
                            <span className="text-sm text-gray-500">R$</span>
                            <input
                                type="number"
                                placeholder="0,00"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                className="flex-1 py-2 text-sm bg-transparent focus:outline-none"
                            />
                        </div>
                        <button
                            disabled={saving || !editValue || editingCat === 'new'}
                            onClick={() => handleSave(editingCat)}
                            className="px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors"
                        >
                            {saving ? '...' : 'Salvar'}
                        </button>
                        <button onClick={() => setEditingCat(null)} className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Budget Rows */}
            {categoriesWithBudget.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                    <span className="material-symbols-outlined text-3xl opacity-30 block mb-2">savings</span>
                    Nenhum limite definido ainda. Clique em "Definir Limite" para começar!
                </div>
            ) : (
                <div className="space-y-4">
                    {categoriesWithBudget.map(cat => {
                        const budget = budgets.find(b => b.category === cat);
                        const spent = currentExpenses[cat] || 0;
                        const limit = budget?.amount || 0;
                        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                        const isOver = limit > 0 && spent > limit;
                        const isWarning = limit > 0 && pct >= 80 && !isOver;

                        return (
                            <div key={cat}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-semibold text-text-main dark:text-white">{cat}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${isOver ? 'text-red-600' : isWarning ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                            R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                            {limit > 0 && ` / R$ ${limit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                                        </span>
                                        {limit === 0 ? (
                                            <button onClick={() => { setEditingCat(cat); setEditValue(''); }} className="text-orange-400 hover:text-orange-600 transition-colors">
                                                <span className="material-symbols-outlined text-[14px]">add_circle</span>
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={() => { setEditingCat(cat); setEditValue(String(limit)); }} className="text-gray-300 hover:text-gray-500 transition-colors">
                                                    <span className="material-symbols-outlined text-[14px]">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(cat)} className="text-gray-300 hover:text-red-400 transition-colors">
                                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {limit > 0 && (
                                    <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : isWarning ? 'bg-orange-400' : 'bg-emerald-500'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                )}
                                {isOver && (
                                    <p className="text-[10px] text-red-500 font-bold mt-0.5">
                                        ⚠ Acima do limite em R$ {(spent - limit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}!
                                    </p>
                                )}
                                {isWarning && (
                                    <p className="text-[10px] text-orange-500 font-bold mt-0.5">
                                        Atenção: {Math.round(pct)}% do limite usado
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BudgetSection;
