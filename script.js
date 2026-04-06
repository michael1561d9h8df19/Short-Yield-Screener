const STORAGE_KEY = 'gemini_api_key';
const MODEL = 'gemini-1.5-flash';

window.onload = () => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
        updateStatus(true);
    } else {
        openModal();
    }
};

function updateStatus(live) {
    document.getElementById('statusDot').classList.toggle('live', live);
    document.getElementById('statusLabel').textContent = live ? 'CONNECTED' : 'NO API KEY';
}

function openModal() { document.getElementById('overlay').classList.remove('hidden'); }
function closeModal() { document.getElementById('overlay').classList.add('hidden'); }

function saveKey() {
    const val = document.getElementById('keyInput').value.trim();
    if (val) {
        localStorage.setItem(STORAGE_KEY, val);
        updateStatus(true);
        closeModal();
    }
}

function qs(text) {
    document.getElementById('qi').value = text;
    go();
}

async function go() {
    const key = localStorage.getItem(STORAGE_KEY);
    if (!key) return openModal();

    const input = document.getElementById('qi').value;
    const container = document.getElementById('results');
    container.innerHTML = '<p>Accessing Terminal...</p>';

    const prompt = `Return a JSON object only. Screen for: ${input}. 
    Format: {"securities":[{"ticker":"ABC","name":"Name","yield":"5%","summary":"..."}]}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);

        const text = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(text);

        container.innerHTML = result.securities.map(s => `
            <div class="sec-card">
                <div class="sec-ticker">${s.ticker}</div>
                <div style="font-size:12px; color:gray;">${s.name}</div>
                <div style="color:var(--amber); margin:10px 0;">Yield: ${s.yield}</div>
                <div style="font-size:11px; line-height:1.5;">${s.summary}</div>
            </div>
        `).join('');

    } catch (e) {
        container.innerHTML = `<div class="err">ERROR: ${e.message}</div>`;
    }
}
