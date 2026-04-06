const STORAGE_KEY = 'gemini_api_key';
const MODEL = 'gemini-1.5-flash';
let activeCrit = new Set();
let watchlist = [];

// Initialize
window.onload = () => {
    const key = localStorage.getItem(STORAGE_KEY);
    if(key) updateStatus(true);
    else openModal();
};

function updateStatus(live) {
    document.getElementById('statusDot').className = 'status-dot' + (live ? ' live' : '');
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

function tc(btn, text) {
    activeCrit.has(text) ? activeCrit.delete(text) : activeCrit.add(text);
    btn.classList.toggle('on');
}

function qs(q) { document.getElementById('qi').value = q; go(); }

async function go() {
    const key = localStorage.getItem(STORAGE_KEY);
    if (!key) return openModal();

    const query = document.getElementById('qi').value;
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<div class="loading">Analyzing Markets...</div>';

    const systemPrompt = `Return JSON only. Screen for: ${query}. Required: ${[...activeCrit].join(', ')}. 
    Format: {"securities":[{"ticker":"TICKER","name":"Name","type":"etf|equity","yield":"X.X%","summary":"...","stats":[{"label":"PE","value":"15","tone":"pos"}]}]}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        renderResults(result.securities);
    } catch (err) {
        resultsContainer.innerHTML = `<div class="err">Error: ${err.message}</div>`;
    }
}

function renderResults(securities) {
    const container = document.getElementById('results');
    container.innerHTML = securities.map(s => `
        <div class="sec-card">
            <div>
                <div class="sec-ticker">${s.ticker}</div>
                <div class="sec-name">${s.name}</div>
                <div class="sec-badge b-${s.type}">${s.type}</div>
                <div class="sec-summary">${s.summary}</div>
                <button class="pin-btn" onclick="addToWatchlist('${s.ticker}', '${s.yield}')">📌 Pin to Watchlist</button>
            </div>
            <div class="sec-stats">
                <div class="stat-row"><span class="stat-lbl">Yield</span><span class="stat-val hi">${s.yield}</span></div>
                ${s.stats.map(st => `<div class="stat-row"><span>${st.label}</span><span class="stat-val">${st.value}</span></div>`).join('')}
            </div>
        </div>
    `).join('');
}

function addToWatchlist(ticker, yieldVal) {
    if(!watchlist.some(i => i.ticker === ticker)) {
        watchlist.push({ticker, yieldVal});
        renderWatchlist();
    }
}

function renderWatchlist() {
    const container = document.getElementById('watchlistItems');
    container.innerHTML = watchlist.map(i => `
        <div class="watch-card">
            <span style="color:var(--amber)">${i.ticker}</span>
            <span style="float:right">${i.yieldVal}</span>
        </div>
    `).join('');
}

function clearWatchlist() { watchlist = []; renderWatchlist(); }
