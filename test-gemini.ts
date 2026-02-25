import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyC5Dro99InNDYHdRGQeCpdoat-C53mksT8';
const genAI = new GoogleGenerativeAI(API_KEY);

async function testModels() {
    console.log('Listing available models...');
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            const names = data.models
                .filter((m: any) => m.name.includes('gemini'))
                .map((m: any) => m.name.replace('models/', ''));
            console.log('Available_Gemini_Models:', names.join(', '));
        } else {
            console.log('No models found:', JSON.stringify(data));
        }
    } catch (e: any) {
        console.log(`❌ Failed to list models: ${e.message}`);
    }
}

testModels();
