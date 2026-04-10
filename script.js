const STORAGE_KEY = 'gemini_api_key';
const MODEL = 'gemini-flash-latest';

window.onload = () => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (!savedKey) {
        document.getElementById('overlay').classList.remove('hidden');
    } else {
        initDashboard();
    }
};

function saveKey() {
    const val = document.getElementById('keyInput').value.trim();
    if (val) {
        localStorage.setItem(STORAGE_KEY, val);
        document.getElementById('overlay').classList.add('hidden');
        initDashboard();
    }
}

function initDashboard() {
    fetchNews();
    initChart('Market Pulse', [428, 431, 429, 430, 431]);
}

function qs(text) {
    document.getElementById('qi').value = text;
    go();
}

async function fetchNews() {
    const key = localStorage.getItem(STORAGE_KEY);
    const container = document.getElementById('news-content');
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const prompt = `Provide 5 concise financial news headlines for ${today}. 
    Focus on: US-Iran ceasefire peace talks, oil price volatility ($96-$99 range), and Fed holding rates steady.
    Format each as: <div class="news-item"><strong>[HEADLINE]</strong>: [1 sentence summary]</div>`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        container.innerHTML = data.candidates[0].content.parts[0].text;
    } catch (e) {
        container.innerHTML = "News feed offline. Verify API key.";
    }
}

async function go() {
    const key = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    let input = document.getElementById('qi').value;
    const container = document.getElementById('results');
    
    container.innerHTML = '<div style="color:var(--amber)">Scanning Credit Markets...</div>';

    const prompt = `Act as a senior credit analyst. Current Date: ${today}.
    USER QUERY: ${input}.
    STRICT DATA: Use April 10, 2026 data. 10Y Treasury is 4.31%, 2Y is 3.79%. SPSB yield is 4.45%. MUB is 3.38%.
    Format ONLY as JSON: {"securities":[{"ticker":"TICKER","name":"Name","yield":"0.00%","summary":"..."}]}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });
        const data = await response.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        
        container.innerHTML = result.securities.map(s => `
            <div class="sec-card">
                <strong>${s.ticker}</strong> | ${s.name}<br>
                <span style="color:var(--green)">Yield: ${s.yield}</span><br>
                <p style="margin:5px 0 0 0; opacity:0.8;">${s.summary}</p>
            </div>
        `).join('');
    } catch (e) { container.innerHTML = "Error retrieving credit data."; }
}

async function runEquityScreen() {
    const key = localStorage.getItem(STORAGE_KEY);
    const ticker = document.getElementById('eqInput').value.toUpperCase();
    if(!ticker) return;

    // Simulate price movement for chart
    const base = 150 + Math.random() * 100;
    const mockData = [base, base+2, base-1, base+4, base+3];
    initChart(`${ticker} Intra-day`, mockData);

    const prompt = `Quick analyst summary for stock ticker ${ticker} as of April 10, 2026. 
    Mention current P/E, 2026 outlook, and impact of current macro (ceasefire/oil). Max 3 sentences.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        alert(data.candidates[0].content.parts[0].text);
    } catch (e) { alert("Equity analysis failed."); }
}

function initChart(label, dataPoints) {
    const ctx = document.getElementById('equityChart').getContext('2d');
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['9:30', '11:00', '1:00', '3:00', '4:00'],
            datasets: [{
                label: label,
                data: dataPoints,
                borderColor: '#00ff41',
                backgroundColor: 'rgba(0, 255, 65, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#888', font: { family: 'Courier New' } } } },
            scales: {
                y: { grid: { color: '#222' }, ticks: { color: '#888' } },
                x: { grid: { color: '#222' }, ticks: { color: '#888' } }
            }
        }
    });
}
