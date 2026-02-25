import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface ParsedTransaction {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    isInstallment: boolean;
    installmentsCount: number;
}

export const parseTransactionFromAudio = async (text: string): Promise<ParsedTransaction | null> => {
    if (!API_KEY) {
        console.error('API Key do Gemini não configurada!');
        return null;
    }

    try {
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

        const modelsToTry = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro"];
        const genAI = new GoogleGenerativeAI(API_KEY.trim());

        let jsonString = "";
        let success = false;
        let firstError;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model to parse audio: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(context);
                const response = result.response;
                jsonString = response.text();
                success = true;
                break;
            } catch (err: any) {
                console.warn(`Failed with ${modelName}:`, err.message);
                if (!firstError) firstError = err;
            }
        }

        if (!success) {
            throw firstError;
        }

        // Use a robust regex to extract just the JSON object and ignore markdown
        let cleanedJsonString = jsonString.trim();
        const jsonMatch = cleanedJsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedJsonString = jsonMatch[0];
        }

        const parsedData = JSON.parse(cleanedJsonString) as ParsedTransaction;
        return parsedData;

    } catch (error: any) {
        console.error("Gemini Parse Error:", error);
        return null;
    }
};

export interface ParsedSplitTransaction {
    description: string;
    amount: number;
    splitType: 'half' | 'full';
    friends: string[];
}

export const parseSplitTransactionFromAudio = async (text: string): Promise<ParsedSplitTransaction | null> => {
    if (!API_KEY) {
        console.error("No Gemini API key found.");
        return null;
    }

    try {
        const context = `
        Você é um assistente financeiro AI que extrai dados de divisões de contas gastos (rateios) a partir de descrições em áudio.
        
        Sua tarefa é analisar a frase do usuário e retornar EXATAMENTE um objeto JSON válido, sem markdown, contendo as seguintes propriedades:
        - "description": string (Uma descrição curta do que foi gasto, ex: "Uber", "Jantar na pizzaria", "Presente")
        - "amount": number (O valor TOTAL da despesa. Converta palavras numéricas ou extraia do texto. Se não houver, tente inferir ou retorne 0)
        - "splitType": string (Deve ser "half" se a intenção for dividir o valor com alguém, ou "full" se o amigo deve pagar o valor inteiro/tudo. Ex: "Dividir 50 com a Ana" -> "half". "Thiago me deve 100 reais" -> "full")
        - "friends": array de strings (Lista de nomes de pessoas mencionadas para quem o valor deve ser cobrado ou dividido. Ex: ["Ana", "João"])
        
        Texto recebido: "${text}"
        
        Retorne APENAS o JSON e nada mais.
        Exemplo:
        {"description": "Ifood Burger", "amount": 85.50, "splitType": "half", "friends": ["Nathy"]}
        `;

        const modelsToTry = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro"];
        const genAI = new GoogleGenerativeAI(API_KEY.trim());

        let jsonString = "";
        let success = false;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model to parse split audio: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: context }] }]
                });
                jsonString = result.response.text();
                success = true;
                break;
            } catch (err) {
                console.warn(`Failed with ${modelName}:`, err);
            }
        }

        if (!success) {
            console.error("All Gemini models failed to parse split audio.");
            return null;
        }

        let cleanedJsonString = jsonString.trim();
        const jsonMatch = cleanedJsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedJsonString = jsonMatch[0];
        }

        const parsedData = JSON.parse(cleanedJsonString) as ParsedSplitTransaction;
        return parsedData;
    } catch (error: any) {
        console.error("Gemini Parse Split Error:", error);
        return null;
    }
};
