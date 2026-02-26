import fs from 'fs';

async function listModels() {
    try {
        const key = "AIzaSyATd3t6jE84EDxii_DfVgwoe9ZEKg5FV8U";
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        let resultStr = "";
        if (data.models) {
            data.models.forEach(m => {
                resultStr += `${m.name}\n`;
            });
        } else {
            resultStr = JSON.stringify(data, null, 2);
        }
        fs.writeFileSync('available_models.txt', resultStr);
    } catch (e) {
        console.error(e);
    }
}
listModels();
