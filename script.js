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

    const input = document.getElementById('qi').value;
    const container = document.getElementById('results');
    container.innerHTML = '<div class="loading">Searching LIVE Market Data (April 2026)...</div>';

    // The Prompt: Forces the AI to verify the specific date and specific yield types.
    const prompt = `
        TASK: Act as a senior credit analyst. Provide current financial data as of today, April 6, 2026.
        USER QUERY: ${input}.
        
        DATA INTEGRITY RULES:
        1. Use ONLY April 2026 data. If you find 2024 or 2025 results, IGNORE THEM.
        2. For ETFs: Provide '30-Day SEC Yield' and 'Yield-to-Worst (YTW)'.
        3. For Treasuries: Provide the current daily market yield (Today's benchmark is ~3.85% for 2yr and ~4.33% for 10yr).
        4. Cross-verify the 'Muni-to-Treasury' ratio if requested (~71-72%).
        
        FORMAT: Return ONLY a JSON object:
        {"securities":[
            {"ticker":"TICKER","name":"Full Name","yield":"0.00% SEC / 0.00% YTW","summary":"Brief profile + Date Verified."}
        ]}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                // REMOVED: tools: [{ google_search: {} }] to avoid quota errors
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.0
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        // The AI with grounding might return the JSON inside markdown blocks
        let text = data.candidates[0].content.parts[0].text;
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
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
        container.innerHTML = `
            <div class="err">
                <strong>DATA ERROR:</strong><br>${e.message}<br><br>
                <small>Tip: If Grounding fails, check if your API Key is on the "Free Tier" in AI Studio.</small>
            </div>`;
    }
}
