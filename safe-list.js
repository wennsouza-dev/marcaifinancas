const fs = require('fs');
const API_KEY = 'AIzaSyC5Dro99InNDYHdRGQeCpdoat-C53mksT8';

async function list() {
    const log = [];
    try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const d = await r.json();
        if (d.models) {
            d.models.forEach(m => {
                log.push(m.name);
            });
        } else {
            log.push('ERROR: ' + JSON.stringify(d));
        }
    } catch (e) {
        log.push('FETCH ERROR: ' + e.message);
    }
    fs.writeFileSync('clean_models.txt', log.join('\n'));
}

list();
