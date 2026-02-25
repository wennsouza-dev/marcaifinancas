const fs = require('fs');
const API_KEY = 'AIzaSyC5Dro99InNDYHdRGQeCpdoat-C53mksT8';

async function list() {
    try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const d = await r.json();
        const names = d.models ? d.models.map(m => m.name) : ['NONE'];
        fs.writeFileSync('models_list.txt', names.join('\n'));
        console.log('Saved ' + names.length + ' models');
    } catch (e) {
        fs.writeFileSync('models_list.txt', 'ERROR: ' + e.message);
    }
}
list();
