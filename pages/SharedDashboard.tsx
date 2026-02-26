import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

interface SharedExpense {
    split_expense_id: string;
    description: string;
    total_amount: number;
    installment_number: number;
    total_installments: number;
    date: string;
    billing_date: string;
    creator_name: string;
    amount_owed: number;
    is_paid: boolean;
    participant_id: string;
}

const SharedDashboard: React.FC = () => {
    const [expenses, setExpenses] = useState<SharedExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [friendEmail, setFriendEmail] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const navigate = useNavigate();

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    useEffect(() => {
        const storedEmail = localStorage.getItem('shared_friend_email');
        if (!storedEmail) {
            navigate('/shared-login');
            return;
        }
        setFriendEmail(storedEmail);
        fetchSharedExpenses(storedEmail);
    }, [navigate]);

    const fetchSharedExpenses = async (email: string) => {
        try {
            console.log('Fetching shared expenses for email:', email);
            const { data, error } = await supabase.rpc('get_shared_expenses_by_email', {
                friend_email: email
            });

            console.log('RPC Response:', { data, error });

            if (error) throw error;
            setExpenses(data || []);
        } catch (error) {
            console.error('Error fetching shared expenses via RPC:', error);
            // Even if it fails, maybe the RPC isn't created yet or there's network issue
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('shared_friend_email');
        navigate('/shared-login');
    };

    // Filter expenses by month and year
    const filteredExpenses = expenses.filter(expense => {
        const referenceDate = expense.billing_date || expense.date;
        const d = new Date(referenceDate + (referenceDate.includes('T') ? '' : 'T00:00:00'));
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    // Calculate Totals
    const totalOwed = filteredExpenses
        .filter(e => !e.is_paid)
        .reduce((sum, e) => sum + Number(e.amount_owed), 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
            {/* Header */}
            <div className="bg-emerald-700 text-white p-6 shadow-md rounded-b-[40px] mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-vr from-black/10 to-transparent pointer-events-none"></div>
                <div className="max-w-4xl mx-auto relative z-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Meus Gastos</h1>
                        <p className="text-emerald-100 text-sm">{friendEmail}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                        title="Sair"
                    >
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>

                <div className="max-w-4xl mx-auto mt-6">
                    <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-1">Total a Pagar</p>
                    <p className="text-4xl font-bold tracking-tight">{formatCurrency(totalOwed)}</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="max-w-4xl mx-auto px-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-4 items-center shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400">calendar_month</span>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-800 cursor-pointer outline-none"
                        >
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                    </div>
                    <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-800 cursor-pointer outline-none"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="max-w-4xl mx-auto px-4 space-y-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
                    Histórico de Rateios
                </h2>

                {filteredExpenses.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">sentiment_satisfied</span>
                        <p className="text-gray-500 font-medium">Nenhum gasto pendente neste período.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredExpenses.map((expense) => (
                            <div
                                key={expense.participant_id}
                                className={`bg-white p-4 rounded-xl shadow-sm border-l-4 transition-all hover:shadow-md ${expense.is_paid ? 'border-green-500 opacity-75' : 'border-emerald-600'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            {expense.description}
                                            {expense.total_installments && expense.total_installments > 1 && (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                                    {expense.installment_number}/{expense.total_installments}
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <span className="material-symbols-outlined text-[12px]">person</span>
                                            Lançado por {expense.creator_name || 'Usuário'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-lg ${expense.is_paid ? 'text-green-600 line-through' : 'text-emerald-700'}`}>
                                            {formatCurrency(expense.amount_owed)}
                                        </p>
                                        <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">Sua Parte</p>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                            {formatDate(expense.date)}
                                        </span>
                                        {expense.billing_date && (
                                            <span className="text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded cursor-help" title="Fatura">
                                                Fat: {formatDate(expense.billing_date)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        {expense.is_paid ? (
                                            <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                                Pago
                                            </span>
                                        ) : (
                                            <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                Pendente
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedDashboard;
