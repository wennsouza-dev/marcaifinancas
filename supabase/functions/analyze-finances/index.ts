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
        const { history, message, transactions, stats } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY não configurada no servidor.')
        }

        const genAI = new GoogleGenerativeAI(apiKey.trim())
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

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
        Exemplo: Usuário fala "Adiciona um almoço de 50 reais". 
        Você retorna o texto cru exato: 
        \`\`\`json
        {"action": "ADD_TRANSACTION", "transactionType": "expense", "text": "almoço de 50 reais"}
        \`\`\`

        Se o usuário estiver apenas fazendo uma pergunta (ex: "quanto eu gastei de comida?"), responda normalmente em texto plano humanizado, analisando os dados:
        Estatísticas do Mês Atual: 
        Receitas (Total): R$ ${stats.income}
        Despesas (Total): R$ ${stats.expenses}
        Saldo Atual: R$ ${stats.balance}

        Transações recentes:
        ${JSON.stringify(transactions.slice(0, 30))}
    `;

        const chat = model.startChat({
            history: history,
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
        });

        const result = await chat.sendMessage(message);
        const text = result.response.text();

        return new Response(JSON.stringify({ reply: text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
