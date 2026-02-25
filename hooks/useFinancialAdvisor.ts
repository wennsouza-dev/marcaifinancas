import { useState } from 'react';
import { supabase } from '../supabaseClient';

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

    // We only need the text and role for the Gemini API history
    const [chatHistory, setChatHistory] = useState<{ role: string, parts: { text: string }[] }[]>([]);

    const sendMessage = async (text: string) => {
        try {
            const userMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'user',
                text,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, userMsg]);
            setLoading(true);

            // Fetch from edge function instead of local SDK
            const { data, error } = await supabase.functions.invoke('analyze-finances', {
                body: {
                    history: chatHistory,
                    message: text,
                    transactions,
                    stats
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            const responseText = data.reply;

            // Optional: Parse JSON if the AI decided to return an action
            let actionText = responseText;
            let actionContent = null;

            try {
                // simple heuristic to see if it's a JSON block
                const cleaned = responseText.trim();
                const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.action === 'ADD_TRANSACTION') {
                        actionContent = parsed;
                        actionText = "Claro! Posso registrar isso para você. Confirme a ação no botão abaixo.";
                    }
                }
            } catch (e) {
                // Ignore parse errors, just regular text
            }

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: actionText,
                timestamp: new Date(),
                action: actionContent
            };

            setMessages(prev => [...prev, aiMsg]);

            // update history
            setChatHistory(prev => [
                ...prev,
                { role: 'user', parts: [{ text }] },
                { role: 'model', parts: [{ text: responseText }] }
            ]);

        } catch (error) {
            console.error('Advisor Error:', error);
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: "Desculpe, tive um problema de conexão com o cérebro (API). Tente novamente mais tarde.",
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
