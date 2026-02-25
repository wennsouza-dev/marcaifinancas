const https = require('https');
const fs = require('fs');

const API_KEY = 'AIzaSyC5Dro99InNDYHdRGQeCpdoat-C53mksT8';

async function test(m) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${API_KEY}`;
    return new Promise(resolve => {
        const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => resolve({ code: res.statusCode, data }));
        });
        req.write(JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }));
        req.end();
    });
}

async function run() {
    const models = ['gemini-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    const log = [];
    for (const m of models) {
        const res = await test(m);
        log.push(`${m}: ${res.code} - ${res.data}`);
    }
    fs.writeFileSync('final_check.txt', log.join('\n'));
}

run();
