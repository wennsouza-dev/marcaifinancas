const fs = require('fs');
const API_KEY = 'AIzaSyC5Dro99InNDYHdRGQeCpdoat-C53mksT8';

async function audit() {
    const log = [];
    log.push('Starting Audit...');

    try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const d = await r.json();

        if (!d.models) {
            log.push('No models in response: ' + JSON.stringify(d));
        } else {
            log.push(`Found ${d.models.length} models.`);
            for (const m of d.models) {
                log.push(`\nChecking model: ${m.name}`);
                log.push(`  Methods: ${m.supportedGenerationMethods.join(', ')}`);

                // Only test models that support content generation
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    try {
                        const testUrl = `https://generativelanguage.googleapis.com/v1beta/${m.name}:generateContent?key=${API_KEY}`;
                        const tr = await fetch(testUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contents: [{ parts: [{ text: 'say hi' }] }] })
                        });
                        const td = await tr.json();
                        if (td.candidates) {
                            log.push(`  ✅ SUCCESS`);
                        } else if (td.error) {
                            log.push(`  ❌ FAILED: ${td.error.status} - ${td.error.message}`);
                        } else {
                            log.push(`  ❓ UNKNOWN: ${JSON.stringify(td)}`);
                        }
                    } catch (e) {
                        log.push(`  🔥 FETCH ERROR: ${e.message}`);
                    }
                }
            }
        }
    } catch (e) {
        log.push('Audit Failed: ' + e.message);
    }

    fs.writeFileSync('audit_results.txt', log.join('\n'));
    console.log('Audit complete. Check audit_results.txt');
}

audit();
