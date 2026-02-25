const API_KEY = 'AIzaSyC5Dro99InNDYHdRGQeCpdoat-C53mksT8';

async function test(model, version = 'v1beta') {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;
    try {
        const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] })
        });
        const d = await r.json();
        if (d.candidates) return 'OK';
        if (d.error) return `ERROR: ${d.error.status} - ${d.error.message}`;
        return 'UNKNOWN';
    } catch (e) {
        return 'FETCH_ERROR: ' + e.message;
    }
}

async function run() {
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite-preview-02-05',
        'gemini-pro'
    ];
    const versions = ['v1', 'v1beta'];

    for (const m of models) {
        for (const v of versions) {
            const res = await test(m, v);
            console.log(`${m} (${v}): ${res}`);
        }
    }
}

run();
