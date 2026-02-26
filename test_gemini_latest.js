import fs from 'fs';

async function testModels() {
    const models = [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-flash-lite-latest",
        "gemini-flash-latest"
    ];
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
    fs.writeFileSync('test_gemini_results2.json', JSON.stringify(results, null, 2));
}
testModels();
