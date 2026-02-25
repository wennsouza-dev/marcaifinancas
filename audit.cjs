const https = require('https');
const fs = require('fs');

const API_KEY = 'AIzaSyC5Dro99InNDYHdRGQeCpdoat-C53mksT8';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                const names = json.models.map(m => m.name);
                fs.writeFileSync('audit_out.txt', names.join('\n'));
            } else {
                fs.writeFileSync('audit_out.txt', 'Error: ' + JSON.stringify(json));
            }
        } catch (e) {
            fs.writeFileSync('audit_out.txt', 'Parse Error: ' + e.message);
        }
    });
}).on('error', (err) => {
    fs.writeFileSync('audit_out.txt', 'HTTP Error: ' + err.message);
});
