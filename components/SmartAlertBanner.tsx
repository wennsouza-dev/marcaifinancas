import React, { useState, useEffect } from 'react';

interface SpendingAlert {
    category: string;
    currentAmount: number;
    avgAmount: number;
    percentOver: number;
}

interface SmartAlertBannerProps {
    alerts: SpendingAlert[];
    month: number;
    year: number;
}

const SmartAlertBanner: React.FC<SmartAlertBannerProps> = ({ alerts, month, year }) => {
    const storageKey = `dismissed_alerts_${year}_${month}`;
    const [dismissed, setDismissed] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored) setDismissed(JSON.parse(stored));
    }, [storageKey]);

    const dismiss = (category: string) => {
        const next = [...dismissed, category];
        setDismissed(next);
        localStorage.setItem(storageKey, JSON.stringify(next));
    };

    const visible = alerts.filter(a => !dismissed.includes(a.category));
    if (visible.length === 0) return null;

    const formatCurrency = (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const getIcon = (category: string) => {
        const icons: Record<string, string> = {
            'Alimentação': 'restaurant',
            'Transporte': 'directions_car',
            'Lazer': 'sports_esports',
            'Saúde': 'favorite',
            'Educação': 'school',
            'Compras': 'shopping_bag',
            'Casa': 'home',
        };
        return icons[category] || 'warning';
    };

    const getColor = (percent: number) => {
        if (percent >= 80) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', icon: 'text-red-500' };
        if (percent >= 50) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', icon: 'text-orange-500' };
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', icon: 'text-yellow-500' };
    };

    return (
        <div className="space-y-3 mb-6">
            {visible.map(alert => {
                const c = getColor(alert.percentOver);
                return (
                    <div
                        key={alert.category}
                        className={`${c.bg} ${c.border} border rounded-2xl p-4 flex items-start gap-3 animate-fade-in`}
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.badge}`}>
                            <span className={`material-symbols-outlined text-[18px]`}>{getIcon(alert.category)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <p className={`text-sm font-bold ${c.text}`}>
                                    Alerta: {alert.category}
                                </p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge} uppercase tracking-wide`}>
                                    +{Math.round(alert.percentOver)}% acima
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">
                                Este mês: <span className="font-bold text-gray-700">{formatCurrency(alert.currentAmount)}</span>
                                {' · '}Média: <span className="font-medium">{formatCurrency(alert.avgAmount)}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => dismiss(alert.category)}
                            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 mt-0.5"
                            title="Dispensar alerta"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default SmartAlertBanner;
