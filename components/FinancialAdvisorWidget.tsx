import React, { useState, useRef, useEffect } from 'react';
import { useFinancialAdvisor } from '../hooks/useFinancialAdvisor';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface Props {
    transactions: any[];
    stats: any;
    onAddTransaction?: (type: 'income' | 'expense', text: string) => void;
}

const FinancialAdvisorWidget: React.FC<Props> = ({ transactions, stats, onAddTransaction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const { messages, sendMessage, loading } = useFinancialAdvisor(transactions, stats, (type, text) => {
        if (onAddTransaction) {
            onAddTransaction(type, text);
            setIsOpen(false);
        }
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    const handleAudioResult = (text: string) => {
        if (!text.trim()) return;
        setInput(text);
        // Optional: auto-send when speech ends
        // sendMessage(text); 
    };

    const { isRecording, startRecording, stopRecording, hasSupport } = useSpeechRecognition(handleAudioResult);

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-[100px] md:bottom-8 right-4 md:right-8 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-2xl transition-all hover:scale-105 z-[100] flex items-center justify-center border-2 border-white dark:border-gray-800"
                title="Falar com MarcAI"
            >
                <span className="material-symbols-outlined text-3xl">smart_toy</span>
            </button>

            {/* Chat Modal/Window */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:justify-end sm:p-6 pointer-events-none">
                    <div className="pointer-events-auto bg-white dark:bg-gray-900 w-full sm:w-[400px] h-[80vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom-10 fade-in duration-300">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined">smart_toy</span>
                                <div>
                                    <h3 className="font-bold text-sm">MarcAI Advisor</h3>
                                    <p className="text-[10px] text-indigo-100 opacity-80">Inteligencia Artificial</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                            {messages.length === 0 && (
                                <div className="text-center text-gray-400 mt-10">
                                    <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                                    <p className="text-sm">Olá! Sou sua IA financeira.<br />Pergunte sobre seus gastos ou peça dicas!</p>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-bl-none shadow-sm'
                                        }`}>
                                        {/* Simple formatting for line breaks */}
                                        {msg.text && msg.text.split('\n').map((line, i) => (
                                            <p key={i} className="min-h-[1rem] whitespace-pre-wrap">{line}</p>
                                        ))}

                                        {msg.action && msg.action.type === 'ADD_TRANSACTION' && onAddTransaction && (
                                            <button
                                                onClick={() => {
                                                    onAddTransaction(msg.action!.transactionType, msg.action!.text);
                                                    setIsOpen(false);
                                                }}
                                                className="mt-3 bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 font-bold transition-all shadow-sm w-full justify-center"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    {msg.action.transactionType === 'income' ? 'add_circle' : 'remove_circle'}
                                                </span>
                                                {msg.action.transactionType === 'income' ? 'Adicionar Receita' : 'Adicionar Despesa'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-200 dark:border-gray-700 shadow-sm flex gap-1 items-center h-10">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={isRecording ? "Ouvindo sua dúvida..." : "Digite sua dúvida..."}
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                                    disabled={loading || isRecording}
                                />
                                {hasSupport && (
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        type="button"
                                        title={isRecording ? "Parar gravação" : "Falar com o assistente"}
                                        className={`w-12 rounded-xl flex items-center justify-center transition-all ${isRecording
                                            ? 'bg-red-500 text-white animate-pulse shadow-rose-200'
                                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {isRecording ? 'mic_off' : 'mic'}
                                        </span>
                                    </button>
                                )}
                                <button
                                    onClick={handleSend}
                                    disabled={loading || !input.trim() || isRecording}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-12 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                                >
                                    <span className="material-symbols-outlined shrink-0 text-xl">send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FinancialAdvisorWidget;
