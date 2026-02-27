import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EXPENSE_CATEGORIES = ['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Saúde'];

const Onboarding: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [income, setIncome] = useState('');
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [goalTitle, setGoalTitle] = useState('');
    const [goalAmount, setGoalAmount] = useState('');
    const [saving, setSaving] = useState(false);

    const steps = [
        { title: 'Qual é sua renda mensal?', icon: '💰' },
        { title: 'Quais categorias você mais gasta?', icon: '🛒' },
        { title: 'Defina sua primeira meta!', icon: '🎯' },
    ];

    const toggleCat = (cat: string) => setSelectedCats(prev =>
        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );

    const handleFinish = async () => {
        if (!user) return;
        setSaving(true);
        // Save recurring income if provided
        if (income) {
            await supabase.from('recurring_transactions').insert({
                user_id: user.id, description: 'Salário', amount: parseFloat(income.replace(',', '.')),
                type: 'income', category: 'Salário', payment_method: 'Transferência', day_of_month: 5,
            }).select();
        }
        // Save first goal if provided
        if (goalTitle && goalAmount) {
            const deadline = new Date();
            deadline.setMonth(deadline.getMonth() + 6);
            await supabase.from('financial_goals').insert({
                user_id: user.id, title: goalTitle, emoji: '🎯',
                target_amount: parseFloat(goalAmount.replace(',', '.')),
                current_amount: 0, deadline: deadline.toISOString().split('T')[0],
            }).select();
        }
        // Mark onboarding done in localStorage
        localStorage.setItem('onboarding_done', 'true');
        setSaving(false);
        navigate('/dashboard');
    };

    const progressPct = ((step + 1) / steps.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <img src="/logo.svg" alt="MarcAI" className="w-8 h-8" />
                    <span className="font-black text-xl text-emerald-700">MarcAI Finanças</span>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>Passo {step + 1} de {steps.length}</span>
                        <span>{Math.round(progressPct)}% concluído</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7">
                    <div className="text-4xl mb-3 text-center">{steps[step].icon}</div>
                    <h2 className="text-xl font-black text-text-main text-center mb-6">{steps[step].title}</h2>

                    {/* Step 0 — Income */}
                    {step === 0 && (
                        <div>
                            <p className="text-sm text-gray-500 text-center mb-4">Isso nos ajuda a calcular projeções e sugerir metas realistas.</p>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">R$</span>
                                <input
                                    type="text"
                                    value={income}
                                    onChange={e => setIncome(e.target.value)}
                                    placeholder="0.000,00"
                                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 1 — Categories */}
                    {step === 1 && (
                        <div>
                            <p className="text-sm text-gray-500 text-center mb-4">Selecione as categorias onde mais investe seu dinheiro.</p>
                            <div className="grid grid-cols-2 gap-2">
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCat(cat)}
                                        className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${selectedCats.includes(cat)
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {cat === 'Alimentação' ? 'restaurant' : cat === 'Transporte' ? 'directions_car' : cat === 'Lazer' ? 'sports_esports' : cat === 'Moradia' ? 'home' : 'local_hospital'}
                                        </span>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Goal */}
                    {step === 2 && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500 text-center mb-4">Defina um objetivo financeiro para começar com motivação!</p>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome da Meta</label>
                                <input
                                    value={goalTitle}
                                    onChange={e => setGoalTitle(e.target.value)}
                                    placeholder="Ex: Viagem para Europa"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor Alvo (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">R$</span>
                                    <input
                                        value={goalAmount}
                                        onChange={e => setGoalAmount(e.target.value)}
                                        placeholder="5.000,00"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400 text-center">Você pode pular e criar metas depois na aba Metas</p>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-3 mt-8">
                        {step > 0 && (
                            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                                Voltar
                            </button>
                        )}
                        {step < steps.length - 1 ? (
                            <button onClick={() => setStep(s => s + 1)} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-colors">
                                Continuar
                            </button>
                        ) : (
                            <button onClick={handleFinish} disabled={saving} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                                {saving ? 'Salvando...' : '🚀 Começar!'}
                            </button>
                        )}
                    </div>
                    {step < steps.length - 1 && (
                        <button onClick={() => setStep(s => s + 1)} className="w-full mt-2 text-xs text-gray-400 hover:text-gray-500 transition-colors">
                            Pular esta etapa
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
