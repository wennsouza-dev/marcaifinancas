import { useState, useEffect } from 'react';

export interface SmartAlert {
    id: string;
    type: 'warning' | 'info' | 'critical' | 'success';
    title: string;
    message: string;
    action?: () => void;
    actionLabel?: string;
}

export const useSmartAccountant = (transactions: any[], currentBalance: number) => {
    const [alerts, setAlerts] = useState<SmartAlert[]>([]);

    useEffect(() => {
        if (!transactions || transactions.length === 0) return;

        const newAlerts: SmartAlert[] = [];

        // 1. DUPLICATE DETECTION
        // Look for transactions with same Description AND Amount within the same day
        const paramsMap = new Map();
        transactions.forEach(t => {
            // Create a unique key for "potential duplicate"
            const key = `${t.date}-${t.amount}-${t.description?.trim().toLowerCase()}-${t.type}`;
            if (paramsMap.has(key)) {
                paramsMap.set(key, [...paramsMap.get(key), t]);
            } else {
                paramsMap.set(key, [t]);
            }
        });

        paramsMap.forEach((duplicates, key) => {
            if (duplicates.length > 1) {
                newAlerts.push({
                    id: `dup-${key}`,
                    type: 'warning',
                    title: 'Possível Duplicidade',
                    message: `Encontrei ${duplicates.length} lançamentos de "${duplicates[0].description}" no valor de R$ ${Number(duplicates[0].amount).toFixed(2)} no dia ${new Date(duplicates[0].date).toLocaleDateString()}.`,
                });
            }
        });

        // 2. HIGH SPENDING ALERT (Category Anomalies)
        // Simple logic: If a single category constitutes > 40% of expenses (excluding housing/fixed usually, but let's keep simple)
        const expenses = transactions.filter(t => t.type === 'expense');
        const totalExpense = expenses.reduce((acc, t) => acc + Number(t.amount), 0);

        if (totalExpense > 0) {
            const categoryTotals: Record<string, number> = {};
            expenses.forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
            });

            Object.entries(categoryTotals).forEach(([cat, amount]) => {
                const percentage = (amount / totalExpense) * 100;
                if (percentage > 40 && totalExpense > 1000) { // Threshold to avoid noise on low volume
                    newAlerts.push({
                        id: `high-${cat}`,
                        type: 'info',
                        title: `Concentração de Gastos`,
                        message: `A categoria "${cat}" representa ${Math.round(percentage)}% das suas despesas este mês.`,
                    });
                }
            });
        }

        // 3. BALANCE FORECAST (Simple)
        // If we are mostly through the month but have plenty of budget? 
        // Or warning about negative balance.
        if (currentBalance < 0) {
            newAlerts.push({
                id: 'neg-balance',
                type: 'critical',
                title: 'Saldo Negativo',
                message: 'Sua conta fechou no vermelho este mês. Revise seus gastos supérfluos.',
            });
        }

        setAlerts(newAlerts);

    }, [transactions, currentBalance]);

    return { alerts };
};
