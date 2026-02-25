import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { text, type } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY não configurada no servidor.')
        }

        const genAI = new GoogleGenerativeAI(apiKey.trim())

        let context = '';
        if (type === 'split') {
            context = `
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
        } else {
            context = `
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
        }

        const modelsToTry = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro"];
        let jsonString = "";
        let success = false;
        let firstError;

        for (const modelName of modelsToTry) {
            try {
                console.log("Trying model to parse audio:", modelName);
                const model = genAI.getGenerativeModel({ model: modelName });

                let result;
                if (type === 'split') {
                    result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: context }] }]
                    });
                } else {
                    result = await model.generateContent(context);
                }

                jsonString = result.response.text();
                success = true;
                break;
            } catch (err: any) {
                console.warn("Failed with model:", err.message);
                if (!firstError) firstError = err;
            }
        }

        if (!success) {
            throw firstError || new Error("All Gemini models failed");
        }

        let cleanedJsonString = jsonString.trim();
        const jsonMatch = cleanedJsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedJsonString = jsonMatch[0];
        }

        const parsedData = JSON.parse(cleanedJsonString);

        return new Response(JSON.stringify({ data: parsedData, rawTranscript: text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'Erro Desconhecido' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})
