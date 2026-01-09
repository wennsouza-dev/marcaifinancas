import React, { useState } from 'react';
import { SmartAlert } from '../hooks/useSmartAccountant';

interface Props {
    alerts: SmartAlert[];
}

const SmartAccountantWidget: React.FC<Props> = ({ alerts }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (alerts.length === 0) {
        // Optional: Show "All good" state or return null to hide
        return (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-sm p-4 text-white flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm md:text-base">Tudo Certo!</h3>
                        <p className="text-xs md:text-sm text-emerald-100">O Contador Inteligente não detectou problemas.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Prioritize critical alerts
    const criticalCount = alerts.filter(a => a.type === 'critical').length;
    const topAlert = alerts[0]; // Just show the first one when collapsed

    return (
        <div className={`bg-white dark:bg-surface-dark rounded-2xl shadow-sm border ${criticalCount > 0 ? 'border-red-100 dark:border-red-900/30' : 'border-gray-100 dark:border-white/5'} mb-8 overflow-hidden transition-all duration-300`}>
            <div
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${criticalCount > 0 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${criticalCount > 0 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        <span className="material-symbols-outlined">
                            {criticalCount > 0 ? 'warning' : 'smart_toy'}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-sm md:text-base flex items-center gap-2">
                            Contador Inteligente
                            {alerts.length > 1 && !isExpanded && (
                                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                    +{alerts.length - 1}
                                </span>
                            )}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {isExpanded ? 'Análise completa das suas finanças' : topAlert.message}
                        </p>
                    </div>
                </div>
                <button className="text-gray-400">
                    <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
            </div>

            {isExpanded && (
                <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
                    {alerts.map((alert, idx) => (
                        <div key={idx} className="p-4 border-b border-gray-100 dark:border-white/5 last:border-0 flex gap-3">
                            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${alert.type === 'critical' ? 'bg-red-500' :
                                    alert.type === 'warning' ? 'bg-amber-500' :
                                        'bg-blue-500'
                                }`}></div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">{alert.title}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{alert.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SmartAccountantWidget;
