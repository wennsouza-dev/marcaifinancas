import React from 'react';

const ChartComponent: React.FC = () => {
    // Placeholder data for a simple bar chart
    const data = [
        { label: 'Jan', value: 30 },
        { label: 'Fev', value: 45 },
        { label: 'Mar', value: 60 },
        { label: 'Abr', value: 40 },
        { label: 'Mai', value: 75 },
        { label: 'Jun', value: 55 },
    ];

    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="w-full h-full flex items-end justify-between gap-2 px-2 pb-6 relative">
            {/* Background Grid Lines */}
            <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none z-0">
                <div className="w-full h-px bg-gray-100 dark:bg-white/5 border-t border-dashed border-gray-200 dark:border-white/10"></div>
                <div className="w-full h-px bg-gray-100 dark:bg-white/5 border-t border-dashed border-gray-200 dark:border-white/10"></div>
                <div className="w-full h-px bg-gray-100 dark:bg-white/5 border-t border-dashed border-gray-200 dark:border-white/10"></div>
                <div className="w-full h-px bg-gray-100 dark:bg-white/5 border-t border-dashed border-gray-200 dark:border-white/10"></div>
                <div className="w-full h-px bg-gray-100 dark:bg-white/5 border-t border-dashed border-gray-200 dark:border-white/10"></div>
            </div>

            {data.map((item, index) => (
                <div key={index} className="flex flex-col items-center justify-end h-full z-10 w-full group relative">
                    <div
                        className="w-full max-w-[40px] bg-primary/20 dark:bg-primary/30 rounded-t-lg transition-all duration-500 ease-out group-hover:bg-primary group-hover:scale-y-105 origin-bottom relative"
                        style={{ height: `${(item.value / maxValue) * 100}%` }}
                    >
                        {/* Tooltip on hover */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                            {item.value}%
                        </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-3 absolute -bottom-0">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

export default ChartComponent;
