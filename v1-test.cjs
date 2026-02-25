const https = require('https');
const fs = require('fs');

const API_KEY = 'AIzaSyC5Dro99InNDYHdRGQeCpdoat-C53mksT8';
const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];

async function testAll() {
    const log = [];
    for (const m of models) {
        const url = `https://generativelanguage.googleapis.com/v1/models/${m}:generateContent?key=${API_KEY}`;
        const res = await new Promise(resolve => {
            const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
                let data = '';
                res.on('data', d => data += d);
                res.on('end', () => resolve({ code: res.statusCode, data }));
            });
            req.write(JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }));
            req.end();
        });
        log.push(`${m} (v1): ${res.code} - ${res.data}`);
    }
    fs.writeFileSync('v1_test.txt', log.join('\n'));
}

testAll();
