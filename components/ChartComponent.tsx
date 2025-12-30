import React from 'react';

interface ChartData {
    label: string;
    income: number;
    expense: number;
}

interface Props {
    data?: ChartData[];
}

const ChartComponent: React.FC<Props> = ({ data = [] }) => {
    // Determine max value for scaling, ensure it's at least 1 to avoid division by zero
    const maxValue = data.length > 0
        ? Math.max(...data.flatMap(d => [d.income, d.expense]), 1)
        : 100;

    if (data.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-xl">
                <span className="material-symbols-outlined text-4xl mb-2 text-gray-200 dark:text-gray-700">bar_chart</span>
                <p className="text-sm">Sem dados para exibir</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-end justify-between gap-2 px-2 pb-8 relative">
            {/* Background Grid Lines */}
            <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none z-0">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-px bg-gray-100 dark:bg-white/5 border-t border-dashed border-gray-200 dark:border-white/10"></div>
                ))}
            </div>

            {data.map((item, index) => (
                <div key={index} className="flex flex-col items-center justify-end h-full z-10 w-full group relative min-w-0">
                    {/* Bars Container */}
                    <div className="flex items-end gap-0.5 sm:gap-1 w-full justify-center px-0.5 sm:px-1 h-full mb-1">
                        {/* Tooltip */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-30 shadow-xl flex gap-2">
                            <span className="text-emerald-400 font-bold">+{item.income.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                            <span className="text-red-400 font-bold">-{item.expense.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                        </div>

                        {/* Income Bar */}
                        <div
                            className="flex-1 max-w-[12px] sm:max-w-[14px] bg-primary/40 dark:bg-primary/50 rounded-t-[2px] sm:rounded-t-[3px] transition-all duration-500 ease-out group-hover:bg-primary origin-bottom"
                            style={{ height: `${(item.income / maxValue) * 100}%` }}
                        ></div>
                        {/* Expense Bar */}
                        <div
                            className="flex-1 max-w-[12px] sm:max-w-[14px] bg-red-500/40 dark:bg-red-500/50 rounded-t-[2px] sm:rounded-t-[3px] transition-all duration-500 ease-out group-hover:bg-red-500 origin-bottom"
                            style={{ height: `${(item.expense / maxValue) * 100}%` }}
                        ></div>
                    </div>
                    {/* Month Label */}
                    <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 absolute -bottom-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-center">
                        {item.label.split(' de ')[0]}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default ChartComponent;
