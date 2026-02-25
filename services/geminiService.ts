import { supabase } from '../supabaseClient';

export interface ParsedTransaction {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    isInstallment: boolean;
    installmentsCount: number;
}

export const parseTransactionFromAudio = async (text: string): Promise<{ data: ParsedTransaction | null, error?: string, rawTranscript?: string }> => {
    try {
        const { data, error } = await supabase.functions.invoke('parse-audio', {
            body: { text, type: 'general' }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        return { data: data.data, rawTranscript: text };
    } catch (error: any) {
        console.error("Supabase Edge Function Parse Error:", error);
        return { data: null, error: error.message || 'Erro desconhecido ao parsear o JSON', rawTranscript: text };
    }
};

export interface ParsedSplitTransaction {
    description: string;
    amount: number;
    splitType: 'half' | 'full';
    friends: string[];
}

export const parseSplitTransactionFromAudio = async (text: string): Promise<ParsedSplitTransaction | null> => {
    try {
        const { data, error } = await supabase.functions.invoke('parse-audio', {
            body: { text, type: 'split' }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        return data.data;
    } catch (error: any) {
        console.error("Supabase Edge Function Parse Split Error:", error);
        return null;
    }
};
