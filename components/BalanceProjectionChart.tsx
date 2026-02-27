import React from 'react';

interface ProjectionPoint {
    month: string;
    balance: number;
}

interface BalanceProjectionChartProps {
    data: ProjectionPoint[];
    currentBalance: number;
}

const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const BalanceProjectionChart: React.FC<BalanceProjectionChartProps> = ({ data, currentBalance }) => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.balance);
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, 1);
    const range = maxVal - minVal || 1;

    const endBalance = data[data.length - 1]?.balance ?? 0;
    const trend = endBalance - currentBalance;
    const hasNegative = minVal < 0;

    // Map value -> y% in the SVG canvas (inverted: higher = lower y%)
    const toY = (v: number) => 100 - ((v - minVal) / range) * 100;

    const chartH = 120; // px height of the chart area
    const chartW = 100; // % width
    const pts = data.map((d, i) => {
        const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
        const y = toY(d.balance);
        return { x, y, ...d };
    });

    const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
    const zeroY = toY(0);

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-5 mb-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-base font-bold text-text-main dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-indigo-500">query_stats</span>
                        Previsão dos Próximos 3 Meses
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Baseado no seu histórico de gastos e renda média</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tendência</p>
                    <p className={`text-sm font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {trend >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(trend))}
                    </p>
                </div>
            </div>

            {/* Negative warning */}
            {hasNegative && (
                <div className="flex items-center gap-2 mb-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <span className="material-symbols-outlined text-red-500 text-[16px]">warning</span>
                    <p className="text-xs font-bold text-red-600">Atenção: saldo pode ficar negativo em algum mês</p>
                </div>
            )}

            {/* SVG Line Chart */}
            <div className="relative w-full overflow-hidden" style={{ height: chartH }}>
                <svg
                    viewBox={`0 0 100 100`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Zero reference line */}
                    {zeroY >= 0 && zeroY <= 100 && (
                        <line
                            x1="0" y1={zeroY} x2="100" y2={zeroY}
                            stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2"
                        />
                    )}
                    {/* Gradient fill under line */}
                    <defs>
                        <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.01" />
                        </linearGradient>
                    </defs>
                    <polygon
                        points={`${pts[0].x},100 ${polyline} ${pts[pts.length - 1].x},100`}
                        fill="url(#projGradient)"
                    />
                    {/* Trend line */}
                    <polyline
                        points={polyline}
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {/* Dots */}
                    {pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366F1" stroke="white" strokeWidth="1.5" />
                    ))}
                </svg>
            </div>

            {/* Month Cards */}
            <div className="grid grid-cols-3 gap-2 mt-4">
                {data.map((point, i) => (
                    <div key={i} className={`rounded-xl p-3 text-center ${point.balance >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <p className="text-[10px] text-gray-500 font-medium mb-0.5">{point.month}</p>
                        <p className={`text-sm font-bold ${point.balance >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                            {formatCurrency(point.balance)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BalanceProjectionChart;
