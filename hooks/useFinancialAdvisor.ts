import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
const genAI = new GoogleGenerativeAI(API_KEY);
const MODELS_TO_TRY = ["gemini-1.5-flash-8b", "gemini-1.5-flash", "gemini-2.0-flash"];

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
    action?: {
        type: 'ADD_TRANSACTION';
        transactionType: 'income' | 'expense';
        text: string;
    }
}

export const useFinancialAdvisor = (transactions: any[], stats: any, onActionReceived?: (type: 'income' | 'expense', text: string) => void) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);

    // Format expected by Gemini API: role can be 'user' or 'model'
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);

    const sendMessage = async (text: string) => {
        try {
            if (!API_KEY) throw new Error('Chave Gemini não configurada.');

            const userMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'user',
                text,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, userMsg]);
            setLoading(true);

            const systemInstruction = `
                Você é o MarcAI, um consultor financeiro inteligente da plataforma "MarcAI Finanças".
                Sempre responda em português do Brasil de forma concisa, educada e direta.
                Você pode ajudar o usuário analisando suas transações e dados de resumo (Estatísticas do mês).
                
                Se o usuário quiser *adicionar* ou *registrar* uma transação de entrada ou saída no texto, retorne APENAS um JSON estrito no seguinte formato para que o sistema execute a ação:
                \`\`\`json
                {
                  "action": "ADD_TRANSACTION",
                  "transactionType": "expense" ou "income",
                  "text": "frase extraída que descreve a transação"
                }
                \`\`\`

                Se o usuário estiver apenas fazendo uma pergunta (ex: "quanto eu gastei de comida?"), responda normalmente em texto plano humanizado, analisando os dados:
                Estatísticas do Mês Atual: 
                Receitas (Total): R$ ${stats.income}
                Despesas (Total): R$ ${stats.expenses}
                Saldo Atual: R$ ${stats.balance}

                Transações recentes:
                ${JSON.stringify(transactions.slice(0, 15))}
            `;

            let success = false;
            let responseText = "";
            let firstError;

            for (const modelName of MODELS_TO_TRY) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: systemInstruction
                    });

                    const chat = model.startChat({
                        history: chatHistory,
                    });

                    const result = await chat.sendMessage(text);
                    const response = await result.response;
                    responseText = response.text();
                    success = true;
                    break;
                } catch (err: any) {
                    console.warn(`Model ${modelName} failed:`, err.message);
                    if (!firstError) firstError = err;
                }
            }

            if (!success) throw firstError || new Error('Todos os modelos falharam');

            // Optional: Parse JSON if the AI decided to return an action
            let actionText = responseText;
            let actionContent = null;

            try {
                const cleaned = responseText.trim();
                const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.action === 'ADD_TRANSACTION') {
                        actionContent = parsed;
                        actionText = "Claro! Posso registrar isso para você. Abrirei o formulário agora.";
                        if (onActionReceived) {
                            onActionReceived(parsed.transactionType, parsed.text);
                        }
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: actionText,
                timestamp: new Date(),
                action: actionContent
            };

            setMessages(prev => [...prev, aiMsg]);

            setChatHistory(prev => [
                ...prev,
                { role: 'user', parts: [{ text }] },
                { role: 'model', parts: [{ text: responseText }] }
            ]);

        } catch (error: any) {
            console.error('Advisor Error:', error);
            let userMessage = "Desculpe, tive um problema de conexão com o cérebro (API). Tente novamente mais tarde.";

            if (error.message?.includes('API key not valid') || error.message?.includes('API_KEY_INVALID')) {
                userMessage = "A chave da API do Gemini parece ser inválida. Verifique o seu arquivo .env.";
            } else if (error.message?.includes('quota') || error.message?.includes('429')) {
                userMessage = "Sua cota do Gemini foi excedida (ou o projeto está sem limite). Por favor, gere uma NOVA chave no Google AI Studio (aistudio.google.com) e cole no seu .env.";
            }

            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: userMessage,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setChatHistory([]);
    };

    return { messages, sendMessage, loading, clearChat };
};
