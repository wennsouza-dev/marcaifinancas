import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon, color }) => {
    // Dynamic classes based on color prop
    const bgColors: { [key: string]: string } = {
        blue: 'bg-blue-50 dark:bg-blue-900/20',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
        red: 'bg-red-50 dark:bg-red-900/20',
        primary: 'bg-primary/10 dark:bg-primary/20',
        success: 'bg-emerald-50 dark:bg-emerald-900/20',
        danger: 'bg-red-50 dark:bg-red-900/20',
        info: 'bg-blue-50 dark:bg-blue-900/20',
    };

    const textColors: { [key: string]: string } = {
        blue: 'text-blue-600 dark:text-blue-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        red: 'text-expense dark:text-red-400',
        primary: 'text-primary dark:text-primary-light',
        success: 'text-emerald-600 dark:text-emerald-400',
        danger: 'text-expense dark:text-red-400',
        info: 'text-blue-600 dark:text-blue-400',
    };

    const bgColor = bgColors[color] || 'bg-gray-50';
    const textColor = textColors[color] || 'text-gray-600';

    return (
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center transition-transform hover:scale-105`}>
                    <span className={`material-symbols-outlined ${textColor} text-[24px]`}>{icon}</span>
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${trendUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-expense dark:bg-red-900/30 dark:text-red-400'}`}>
                        <span className="material-symbols-outlined text-[14px]">{trendUp ? 'trending_up' : 'trending_down'}</span>
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{title}</p>
                <h3 className="text-2xl md:text-3xl font-black text-text-main dark:text-white tracking-tight">{value}</h3>
            </div>
        </div>
    );
};

export default StatCard;
