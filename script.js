const STORAGE_KEY = 'gemini_api_key';
// Use 'gemini-flash-latest' to always point to the most recent stable model
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

function openModal() { 
    document.getElementById('overlay').classList.remove('hidden'); 
}

function closeModal() { 
    document.getElementById('overlay').classList.add('hidden'); 
}

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
    container.innerHTML = '<div class="loading">Accessing Market Data (April 2026)...</div>';

    // Analyst-Grade Prompt: Forces strict date checking and specific fixed-income metrics
    const prompt = `
        TASK: Act as a senior credit analyst. Provide current financial data as of April 6, 2026.
        SEARCH FOCUS: ${input}.
        
        STRICT DATA RULES:
        1. Only use data from April 2026. DISCARD all 2024 or 2025 data.
        2. For ETFs: Provide '30-Day SEC Yield' and 'Yield-to-Worst (YTW)'.
        3. For Treasuries: Provide current daily market yields.
        4. Logic Check: Ensure 2-year and 10-year yields reflect current curve (approx 3.8% and 4.3% respectively).
        
        FORMAT: Return ONLY a JSON object:
        {"securities":[
            {"ticker":"TICKER","name":"Full Name","yield":"0.00% YTW","summary":"Brief credit profile with April 2026 verification."}
        ]}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.1 // Lower temperature for higher factual accuracy
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const text = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(text);

        if (!result.securities || result.securities.length === 0) {
            container.innerHTML = '<div class="err">No matching securities found for this criteria.</div>';
            return;
        }

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
        container.innerHTML = `
            <div class="err">
                <strong>TERMINAL ERROR:</strong><br>
                ${e.message}<br><br>
                <small>Tip: If "prepayment" error persists, ensure billing is disabled in Google Cloud Console to force the Free Tier.</small>
            </div>`;
    }
}
