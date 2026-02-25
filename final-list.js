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
                fs.writeFileSync('final_models_list.txt', names.join('\n'));
                console.log('Success: ' + names.length + ' models found.');
            } else {
                fs.writeFileSync('final_models_list.txt', 'Error: ' + JSON.stringify(json));
                console.log('API Error: check final_models_list.txt');
            }
        } catch (e) {
            console.log('Parse Error: ' + e.message);
        }
    });
}).on('error', (err) => {
    console.log('HTTP Error: ' + err.message);
});
