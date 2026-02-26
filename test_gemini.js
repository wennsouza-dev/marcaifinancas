import fs from 'fs';

async function testModels() {
    const models = ["gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
    const key = "AIzaSyATd3t6jE84EDxii_DfVgwoe9ZEKg5FV8U";
    let results = {};

    for (const model of models) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Oi" }] }] })
            });
            const data = await response.json();
            if (data.error) {
                results[model] = data.error.message;
            } else {
                results[model] = "SUCCESS";
            }
        } catch (e) {
            results[model] = e.message;
        }
    }
    fs.writeFileSync('test_gemini_results.json', JSON.stringify(results, null, 2));
}
testModels();
