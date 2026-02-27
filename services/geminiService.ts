import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
const genAI = new GoogleGenerativeAI(API_KEY);

export interface ParsedTransaction {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    isInstallment: boolean;
    installmentsCount: number;
}

const MODELS_TO_TRY = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

export const parseTransactionFromAudio = async (text: string): Promise<{ data: ParsedTransaction | null, error?: string, rawTranscript?: string }> => {
    try {
        if (!API_KEY) throw new Error('Chave Gemini (VITE_GEMINI_API_KEY) não configurada.');

        const context = `
        Você é um assistente financeiro especializado em extrair dados de áudios transcritos.
        Seu objetivo é extrair informações sobre transações financeiras do texto fornecido e retornar EXCLUSIVAMENTE um objeto JSON válido.
        Não inclua crases, blocos de código markdown (\`\`\`json) ou qualquer outro texto na resposta. Apenas o JSON puro.
        
        Texto recebido: "${text}"
        
        Regras de Extração:
        - type: "income" (receita/ganho) ou "expense" (despesa/gasto).
        - amount: O valor numérico da transação (ex: 150.50).
        - description: Uma descrição curta (ex: "Supermercado", "Salário", "TV").
        - category: Uma das seguintes categorias:
            * Se "expense": "Alimentação", "Transporte", "Lazer", "Moradia", "Eletrônicos", "Saúde", "Outros"
            * Se "income": "Salário", "Freelance", "Investimentos", "Presentes", "Outros"
        - isInstallment: true se a transação for parcelada/dividida, false caso contrário.
        - installmentsCount: O número de parcelas (ex: 3). Se não for parcelado, retorne 1.
        
        Formato JSON esperado:
        {
            "type": "expense",
            "amount": 150.00,
            "description": "Supermercado",
            "category": "Alimentação",
            "isInstallment": true,
            "installmentsCount": 3
        }
        `;

        let success = false;
        let jsonString = "";
        let firstError;

        for (const modelName of MODELS_TO_TRY) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(context);
                const response = await result.response;
                jsonString = response.text();
                success = true;
                break;
            } catch (err: any) {
                console.warn(`Model ${modelName} failed:`, err.message);
                if (!firstError) firstError = err;
            }
        }

        if (!success) throw firstError || new Error('Todos os modelos do Gemini falharam.');

        let cleanedJsonString = jsonString.trim();
        const jsonMatch = cleanedJsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedJsonString = jsonMatch[0];
        }

        const parsedData = JSON.parse(cleanedJsonString);
        return { data: parsedData, rawTranscript: text };
    } catch (error: any) {
        console.error("Local Parse Error:", error);
        return { data: null, error: error.message || 'Erro ao processar a IA localmente', rawTranscript: text };
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
        if (!API_KEY) throw new Error('Chave Gemini não configurada.');

        const context = `
        Você é um assistente financeiro AI que extrai dados de divisões de contas gastos (rateios) a partir de descrições em áudio.
        
        Sua tarefa é analisar a frase do usuário e retornar EXATAMENTE um objeto JSON válido, sem markdown, contendo as seguintes propriedades:
        - "description": string (Uma descrição curta do que foi gasto, ex: "Uber", "Jantar na pizzaria", "Presente")
        - "amount": number (O valor TOTAL da despesa. Converta palavras numéricas ou extraia do texto. Se não houver, tente inferir ou retorne 0)
        - "splitType": string (Deve ser "half" se a intenção for dividir o valor com alguém, ou "full" se o amigo deve pagar o valor inteiro/tudo. Ex: "Dividir 50 com a Ana" -> "half". "Thiago me deve 100 reais" -> "full")
        - "friends": array de strings (Lista de nomes de pessoas mencionadas para quem o valor deve ser cobrado ou dividido. Ex: ["Ana", "João"])
        
        Texto recebido: "${text}"
        
        Retorne APENAS o JSON e nada mais.
        `;

        let success = false;
        let jsonString = "";
        let firstError;

        for (const modelName of MODELS_TO_TRY) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(context);
                const response = await result.response;
                jsonString = response.text();
                success = true;
                break;
            } catch (err: any) {
                if (!firstError) firstError = err;
            }
        }

        if (!success) return null;

        let cleanedJsonString = jsonString.trim();
        const jsonMatch = cleanedJsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedJsonString = jsonMatch[0];
        }

        return JSON.parse(cleanedJsonString);
    } catch (error: any) {
        console.error("Local Parse Split Error:", error);
        return null;
    }
};

// ========================
// MONTHLY INSIGHT (Feature 1)
// ========================
export const generateMonthlyInsight = async (
    monthName: string,
    income: number,
    expenses: number,
    balance: number,
    prevIncome: number,
    prevExpenses: number,
    topCategories: { category: string; amount: number }[]
): Promise<string | null> => {
    try {
        if (!API_KEY) return null;

        const catList = topCategories
            .map(c => `${c.category}: R$ ${c.amount.toFixed(2)}`)
            .join(', ');

        const prompt = `
Você é o MarcAI, um consultor financeiro brasileiro amigável e direto.
Analise os dados financeiros do mês de ${monthName} e gere um parágrafo ÚNICO e CONCISO (máximo 3 frases) com insights práticos e personalizados em português.
Seja encorajador quando o resultado for positivo, e honesto e construtivo quando for negativo.
Não use listas, apenas texto corrido. Não use asteriscos nem markdown.

Dados do mês:
- Receitas: R$ ${income.toFixed(2)} (mês anterior: R$ ${prevIncome.toFixed(2)})
- Despesas: R$ ${expenses.toFixed(2)} (mês anterior: R$ ${prevExpenses.toFixed(2)})
- Saldo: R$ ${balance.toFixed(2)}
- Maiores categorias de gasto: ${catList || 'Sem dados'}

Responda apenas com o parágrafo de análise, sem introdução ou cabeçalho.
        `.trim();

        for (const modelName of MODELS_TO_TRY) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const text = (await result.response).text().trim();
                if (text) return text;
            } catch (err: any) {
                console.warn(`generateMonthlyInsight: ${modelName} failed`, err.message);
            }
        }
        return null;
    } catch (e) {
        return null;
    }
};

// ========================
// CATEGORY SUGGESTION (Feature 2)
// ========================
export const suggestCategory = async (description: string): Promise<string | null> => {
    if (!description || description.length < 3 || !API_KEY) return null;
    try {
        const prompt = `
Você é um classificador de transações financeiras.
Dado o nome de uma transação, retorne APENAS o nome da categoria mais adequada, sem explicações.
Use EXATAMENTE uma dessas categorias: Alimentação, Transporte, Lazer, Moradia, Eletrônicos, Saúde, Educação, Salário, Freelance, Investimentos, Presentes, Outros.

Transação: "${description}"
Categoria:`.trim();

        for (const modelName of MODELS_TO_TRY) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const text = (await result.response).text().trim();
                const valid = ['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Eletrônicos', 'Saúde', 'Educação', 'Salário', 'Freelance', 'Investimentos', 'Presentes', 'Outros'];
                const found = valid.find(c => text.startsWith(c));
                if (found) return found;
            } catch (err: any) {
                console.warn(`suggestCategory: ${modelName} failed`, err.message);
            }
        }
        return null;
    } catch (e) {
        return null;
    }
};

