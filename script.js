const STORAGE_KEY = 'gemini_api_key';
const MODEL = 'gemini-flash-latest';

window.onload = () => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
        updateStatus(true);
    } else {
        openModal();
    }
};

function updateStatus(live) {
    const dot = document.getElementById('statusDot');
    const label = document.getElementById('statusLabel');
    if (dot) dot.classList.toggle('live', live);
    if (label) label.textContent = live ? 'CONNECTED' : 'OFFLINE';
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

    // DYNAMIC DATE INJECTION
    const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    let input = document.getElementById('qi').value;
    const container = document.getElementById('results');
    container.innerHTML = `<div class="loading">Fetching Institutional Data for ${today}...</div>`;

    // PROMPT ENHANCER: Translates buttons into professional research requests
    if (input === 'Yield Curve Summary') {
        input = `Generate a full US Treasury yield curve table (1M, 2Y, 5Y, 10Y, 30Y) for ${today}.`;
    } else if (input === 'SPSB vs MUB Relative Value') {
        input = `Compare SPSB and MUB. Provide 30-day SEC Yields and Taxable Equivalent Yield (37% bracket) for ${today}.`;
    }

    const prompt = `
        INSTRUCTIONS: You are a senior fixed-income research terminal. 
        Current Date: ${today}.
        
        DATA RIGIDITY RULES:
        1. Access your most recent knowledge of April 2026 markets. 
        2. DISCARD all data from 2024, 2025, or early 2026 before April.
        3. For ETFs: You MUST provide '30-Day SEC Yield' and 'Yield-to-Worst'.
        4. For Treasuries: Use active market yields (Approx 3.79% for 2Y, 4.30% for 10Y).
        
        USER QUERY: ${input}.
        
        FORMAT: Return ONLY a JSON object:
        {"securities":[
            {"ticker":"TICKER","name":"Name","yield":"0.00% SEC / 0.00% YTW","summary":"Analysis verified as of ${today}."}
        ]}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.0 // Strict factual adherence
                }
            })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);

        const text = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(text);

        container.innerHTML = result.securities.map(s => `
            <div class="sec-card">
                <div class="sec-ticker">${s.ticker}</div>
                <div style="font-size:12px; font-weight:600; color:#888; margin-bottom:8px;">${s.name}</div>
                <div style="color:var(--amber); font-size:1.1rem; border-bottom:1px solid var(--border); padding-bottom:5px; margin-bottom:8px;">
                    Yield: ${s.yield}
                </div>
                <div style="font-size:11px; line-height:1.4; color:var(--text); opacity:0.9;">${s.summary}</div>
            </div>
        `).join('');

    } catch (e) {
        container.innerHTML = `<div class="err"><strong>TERMINAL ERROR:</strong><br>${e.message}</div>`;
    }
}
