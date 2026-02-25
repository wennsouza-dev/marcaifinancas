import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
    month: number;
    invested: number;
    interest: number;
    total: number;
}

const Investments: React.FC = () => {
    const { user } = useAuth();
    const [totalInvested, setTotalInvested] = useState(0);
    const [loading, setLoading] = useState(true);

    // Calculator State
    const [initialAmount, setInitialAmount] = useState<string>('0');
    const [interestRate, setInterestRate] = useState<string>('0');
    const [rateType, setRateType] = useState<'ANUAL' | 'MENSAL'>('ANUAL');
    const [period, setPeriod] = useState<string>('0');
    const [periodType, setPeriodType] = useState<'ANOS' | 'MESES'>('ANOS');
    const [monthlyAmount, setMonthlyAmount] = useState<string>('0');

    // Results State
    const [hasCalculated, setHasCalculated] = useState(false);
    const [resultTotalInvested, setResultTotalInvested] = useState(0);
    const [resultTotalInterest, setResultTotalInterest] = useState(0);
    const [resultTotalFinal, setResultTotalFinal] = useState(0);
    const [chartData, setChartData] = useState<ChartData[]>([]);

    useEffect(() => {
        const fetchInvestments = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('user_id', user.id)
                    .eq('type', 'expense')
                    .eq('category', 'Investimentos');

                if (error) throw error;
                const total = data.reduce((sum, item) => sum + Number(item.amount), 0);
                setTotalInvested(total);
            } catch (error) {
                console.error('Error fetching investments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvestments();
    }, [user]);

    const formatCurrencyInput = (value: string) => {
        const num = value.replace(/\D/g, "");
        if (num === "") return "0,00";
        const formatted = (parseInt(num, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        return formatted;
    };

    const parseCurrency = (value: string) => {
        if (!value) return 0;
        return parseFloat(value.replace(/\./g, "").replace(",", "."));
    };

    const handleCalculate = () => {
        const p_initial = parseCurrency(initialAmount);
        const p_monthly = parseCurrency(monthlyAmount);
        let r = parseFloat(interestRate.replace(",", ".")) / 100;
        let t = parseInt(period, 10);

        if (isNaN(t) || isNaN(r)) return;

        // Convert everything to months for the calculation loop
        const months = periodType === 'ANOS' ? t * 12 : t;
        const monthlyRate = rateType === 'ANUAL' ? (Math.pow(1 + r, 1 / 12) - 1) : r;

        let currentTotal = p_initial;
        let currentInvested = p_initial;
        const data: ChartData[] = [];

        // Push initial state (Month 0)
        data.push({
            month: 0,
            invested: currentInvested,
            interest: 0,
            total: currentTotal
        });

        for (let m = 1; m <= months; m++) {
            currentTotal = currentTotal * (1 + monthlyRate) + p_monthly;
            currentInvested += p_monthly;

            data.push({
                month: m,
                invested: currentInvested,
                interest: currentTotal - currentInvested,
                total: currentTotal
            });
        }

        const finalTotal = currentTotal;
        const totalInterest = finalTotal - currentInvested;

        setResultTotalInvested(currentInvested);
        setResultTotalInterest(totalInterest);
        setResultTotalFinal(finalTotal);
        setChartData(data);
        setHasCalculated(true);
    };

    const handleClear = () => {
        setInitialAmount('0');
        setInterestRate('0');
        setRateType('ANUAL');
        setPeriod('0');
        setPeriodType('ANOS');
        setMonthlyAmount('0');
        setHasCalculated(false);
        setChartData([]);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando investimentos...</div>;
    }

    const pieData = [
        { name: 'Total Investido', value: resultTotalInvested, color: '#4b5563' }, // Gray 600
        { name: 'Total Juros', value: resultTotalInterest, color: '#93c5fd' }, // Blue 300
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-32">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Investimentos e Simulador</h1>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Total Investido Real</h2>
                    <p className="text-3xl font-bold text-emerald-600">
                        {totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
                <div className="size-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                    <span className="material-symbols-outlined text-2xl">account_balance</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="bg-gray-800 text-white px-6 py-4 flex items-center gap-3">
                    <div className="size-8 bg-white/20 rounded flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">monitoring</span>
                    </div>
                    <h3 className="font-bold tracking-wide text-sm md:text-base">SIMULADOR DE JUROS COMPOSTOS</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Row 1 */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Valor Inicial</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium font-mono text-sm">R$</span>
                                <input
                                    type="text"
                                    value={initialAmount}
                                    onChange={(e) => setInitialAmount(formatCurrencyInput(e.target.value))}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Taxa de Juros</label>
                            <div className="flex">
                                <span className="flex items-center justify-center px-4 bg-gray-100 border border-gray-300 border-r-0 rounded-l text-gray-600 font-medium text-sm">%</span>
                                <input
                                    type="text"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors z-10 w-0"
                                    placeholder="0,00"
                                />
                                <select
                                    value={rateType}
                                    onChange={(e) => setRateType(e.target.value as any)}
                                    className="px-2 py-2 border border-gray-300 border-l-0 rounded-r bg-white text-gray-700 focus:border-emerald-500 outline-none uppercase text-xs font-medium z-10 cursor-pointer hover:bg-gray-50"
                                >
                                    <option value="ANUAL">ANUAL</option>
                                    <option value="MENSAL">MENSAL</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Período</label>
                            <div className="flex">
                                <input
                                    type="number"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors z-10 w-0"
                                />
                                <select
                                    value={periodType}
                                    onChange={(e) => setPeriodType(e.target.value as any)}
                                    className="px-2 py-2 border border-gray-300 border-l-0 rounded-r bg-white text-gray-700 focus:border-emerald-500 outline-none uppercase text-xs font-medium z-10 cursor-pointer hover:bg-gray-50"
                                >
                                    <option value="ANOS">ANOS</option>
                                    <option value="MESES">MESES</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Investimento Mensal</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium font-mono text-sm">R$</span>
                                <input
                                    type="text"
                                    value={monthlyAmount}
                                    onChange={(e) => setMonthlyAmount(formatCurrencyInput(e.target.value))}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleClear}
                            className="px-4 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-md font-bold uppercase text-xs tracking-wide hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            LIMPAR <span className="material-symbols-outlined text-[16px]">cleaning_services</span>
                        </button>
                        <button
                            onClick={handleCalculate}
                            className="px-4 md:px-6 py-2 bg-black text-white rounded-md font-bold uppercase text-xs tracking-wide hover:bg-gray-900 transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            CALCULAR <span className="material-symbols-outlined text-[16px]">calculate</span>
                        </button>
                    </div>
                </div>
            </div>

            {hasCalculated && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in mb-8">
                    {/* RESULTADO HEADER */}
                    <div className="bg-gray-800 text-white px-6 py-4 flex items-center gap-3">
                        <div className="size-8 bg-white/20 rounded flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                        </div>
                        <h3 className="font-bold tracking-wide text-sm md:text-base">RESULTADO:</h3>
                    </div>

                    <div className="p-6 border-b border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            <div className="text-center p-4 md:p-6 border border-gray-200 rounded-lg">
                                <h4 className="text-xs md:text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Total em Juros</h4>
                                <p className="text-xl md:text-2xl font-bold text-blue-400">
                                    {resultTotalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className="text-center p-4 md:p-6 border border-gray-200 rounded-lg">
                                <h4 className="text-xs md:text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Valor Total Investido</h4>
                                <p className="text-xl md:text-2xl font-bold text-gray-700">
                                    {resultTotalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className="text-center p-4 md:p-6 border border-gray-200 rounded-lg">
                                <h4 className="text-xs md:text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Valor Total Final</h4>
                                <p className="text-xl md:text-2xl font-bold text-gray-700">
                                    {resultTotalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* GRÁFICO HEADER */}
                    <div className="bg-gray-800 text-white px-6 py-4 flex items-center gap-3 border-t-4 border-gray-100">
                        <div className="size-8 bg-white/20 rounded flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">pie_chart</span>
                        </div>
                        <h3 className="font-bold tracking-wide text-sm md:text-base">GRÁFICO</h3>
                    </div>

                    <div className="p-4 md:p-6">
                        <div className="flex flex-col items-center mb-10 w-full overflow-hidden">
                            <div className="h-64 w-full md:w-3/4 flex justify-center items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={0}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                        <Legend verticalAlign="top" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="h-72 md:h-96 w-full -ml-4 md:ml-0 overflow-hidden pr-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 0, left: 10, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={(val) => val}
                                        label={{ value: 'Meses', position: 'insideBottom', offset: -10 }}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}K`}
                                        tick={{ fontSize: 12 }}
                                        width={60}
                                    />
                                    <RechartsTooltip
                                        formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        labelFormatter={(label) => `Mês ${label}`}
                                        contentStyle={{ fontSize: '14px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="invested" stackId="a" fill="#4b5563" name="Total Investido" />
                                    <Bar dataKey="interest" stackId="a" fill="#93c5fd" name="Total Juros" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Investments;
