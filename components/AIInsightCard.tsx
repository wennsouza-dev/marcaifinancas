import React, { useState } from 'react';

interface AIInsightCardProps {
    insight: string | null;
    loading: boolean;
    onRefresh: () => void;
    monthName: string;
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({ insight, loading, onRefresh, monthName }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!insight) return;
        navigator.clipboard.writeText(insight).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-5 mb-8 shadow-lg shadow-indigo-200 overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm leading-tight">MarcAI Analisa</p>
                        <p className="text-white/60 text-[10px] capitalize">{monthName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {insight && !loading && (
                        <button
                            onClick={handleCopy}
                            title="Copiar análise"
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                        >
                            <span className="material-symbols-outlined text-[15px]">
                                {copied ? 'check' : 'content_copy'}
                            </span>
                        </button>
                    )}
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        title="Regenerar análise"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white disabled:opacity-40"
                    >
                        <span className={`material-symbols-outlined text-[15px] ${loading ? 'animate-spin' : ''}`}>
                            refresh
                        </span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                {loading ? (
                    <div className="flex items-center gap-3 py-2">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <p className="text-white/70 text-sm">Analisando seus dados financeiros...</p>
                    </div>
                ) : insight ? (
                    <p className="text-white/90 text-sm leading-relaxed">{insight}</p>
                ) : (
                    <div className="flex items-center gap-2 py-1">
                        <span className="material-symbols-outlined text-white/40 text-[18px]">info</span>
                        <p className="text-white/60 text-sm">
                            Adicione transações ao mês para gerar sua análise personalizada.
                        </p>
                    </div>
                )}
            </div>

            {/* AI Badge */}
            <div className="mt-3 relative z-10 flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Powered by Gemini AI</span>
                <div className="h-px flex-1 bg-white/10" />
            </div>
        </div>
    );
};

export default AIInsightCard;
