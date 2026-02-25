import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyC5Dro99InNDYHdRGQeCpdoat-C53mksT8';

async function listAllModels() {
    console.log('Fetching ALL models from Google AI API...');
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('--- AVAILABLE MODELS ---');
            data.models.forEach((m) => {
                // Log basic info
                console.log(`Model: ${m.name}`);
                console.log(`  DisplayName: ${m.displayName}`);
                console.log(`  SupportedMethods: ${m.supportedGenerationMethods.join(', ')}`);
                // We can't see quota directly from this API usually, but we can see versions
            });
            console.log('--- END OF MODELS ---');
        } else {
            console.log('No models found:', JSON.stringify(data));
        }
    } catch (e) {
        console.error('Error listing models:', e.message);
    }
}

listAllModels();
