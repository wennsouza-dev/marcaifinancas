import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

export const useFinancialAdvisor = (transactions: any[], stats: any) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async (userText: string) => {
        if (!API_KEY) {
            alert('API Key do Gemini não configurada!');
            return;
        }

        // Add user message immediately
        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            text: userText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            // Prepare Context
            const recentTransactions = transactions.slice(0, 10).map(t =>
                `- ${t.date}: ${t.description} (R$ ${t.amount}) [${t.category}]`
            ).join('\n');

            const context = `
            Você é o MarcAI, um assistente financeiro pessoal, sábio e direto.
            
            DADOS ATUAIS DO USUÁRIO:
            - Saldo Atual: R$ ${stats.balance?.toFixed(2)}
            - Receitas no Mês: R$ ${stats.income?.toFixed(2)}
            - Despesas no Mês: R$ ${stats.expenses?.toFixed(2)}
            
            ÚLTIMAS 10 TRANSAÇÕES:
            ${recentTransactions}
            
            DIRETRIZES:
            1. Seja conciso e útil.
            2. Analise os dados acima para responder. Se o usuário perguntar se pode gastar, verifique o saldo.
            3. Dê dicas práticas de economia se perceber gastos supérfluos.
            4. Se a resposta envolver calculos, explique o raciocínio.
            
            PERGUNTA DO USUÁRIO: "${userText}"
            `;

            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const result = await model.generateContent(context);
            const response = result.response;
            const text = response.text();

            const botMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                text: text,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error: any) {
            console.error("Gemini Error:", error);
            const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                text: "Desculpe, tive um problema ao analisar seus dados agora. Tente novamente.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => setMessages([]);

    return { messages, sendMessage, loading, clearChat };
};
