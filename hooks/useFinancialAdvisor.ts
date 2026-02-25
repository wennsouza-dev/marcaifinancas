import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
            5. SE O USUÁRIO PEDIR PARA ADICIONAR, REGISTRAR OU LANÇAR UMA DESPESA OU RECEITA, no final da mensagem inclua EXATAMENTE o seguinte JSON (e não coloque mais nada depois dele):
            {"action": "ADD_TRANSACTION", "type": "expense" ou "income", "text": "o texto exato que o usuário disse sobre a transação"}
            
            PERGUNTA DO USUÁRIO: "${userText}"
            `;
            const modelsToTry = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro"];
            const genAI = new GoogleGenerativeAI(API_KEY.trim());

            let text = "";
            let success = false;
            let firstError;

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Trying model: ${modelName}`);
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(context);
                    const response = result.response;
                    text = response.text();
                    success = true;
                    break;
                } catch (err: any) {
                    console.warn(`Failed with ${modelName}:`, err.message);
                    if (!firstError) firstError = err; // Keep the first error (most relevant)
                }
            }

            if (!success) {
                throw firstError;
            }

            // Extract JSON action if present
            let actionData;
            let finalBotText = text;
            const actionMatch = finalBotText.match(/\{[\s\S]*"action"\s*:\s*"ADD_TRANSACTION"[\s\S]*\}/);

            if (actionMatch) {
                try {
                    const parsedAction = JSON.parse(actionMatch[0]);
                    actionData = {
                        type: 'ADD_TRANSACTION' as const,
                        transactionType: parsedAction.type,
                        text: parsedAction.text
                    };
                    // Remove the JSON string from the bot message
                    finalBotText = finalBotText.replace(actionMatch[0], '').trim();
                } catch (e) {
                    console.error("Failed to parse action JSON:", e);
                }
            }

            const botMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                text: finalBotText,
                timestamp: new Date(),
                action: actionData
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error: any) {
            console.error("Gemini Error:", error);
            const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                text: `Desculpe, tive um problema ao analisar seus dados. Erro: ${error.message || 'Desconhecido'}`,
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
