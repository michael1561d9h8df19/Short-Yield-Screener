const STORAGE_KEY = 'gemini_api_key';
const MODEL = 'gemini-flash-latest';

// INITIAL LOAD CHECK
window.onload = () => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('conn-status').textContent = "STATUS: CONNECTED";
        initDashboard();
    }
};

function saveKey() {
    console.log("SaveKey Triggered"); // This should now appear in console
    const val = document.getElementById('keyInput').value.trim();
    if (val) {
        localStorage.setItem(STORAGE_KEY, val);
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('conn-status').textContent = "STATUS: CONNECTED";
        initDashboard();
    } else {
        alert("Please enter a valid key.");
    }
}

function initDashboard() {
    fetchNews();
    initChart('Benchmark Pulse', [430, 432, 429, 431, 433]);
}

function qs(text) {
    document.getElementById('qi').value = text;
    go();
}

async function fetchNews() {
    const key = localStorage.getItem(STORAGE_KEY);
    const container = document.getElementById('news-content');
    const today = "Friday, April 10, 2026";

    const prompt = `Provide 4 short news headlines for ${today}. 
    Focus: US-Iran ceasefire progress, oil at $96, and 10Y Treasury at 4.31%.
    Format: <div class="news-item"><strong>[HEADLINE]</strong>: [Description]</div>`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        container.innerHTML = data.candidates[0].content.parts[0].text;
    } catch (e) {
        container.innerHTML = "News offline. Check API billing.";
    }
}

async function go() {
    const key = localStorage.getItem(STORAGE_KEY);
    const today = "April 10, 2026";
    let input = document.getElementById('qi').value;
    const container = document.getElementById('results');
    
    container.innerHTML = '<div style="color:var(--amber);">FETCHING CREDIT DATA...</div>';

    const prompt = `Senior Credit Analyst view for ${today}. 
    USER REQUEST: ${input}.
    MARKET: 10Y 4.31%, 2Y 3.79%, SPSB 4.45%, MUB 3.38%.
    Return ONLY JSON: {"securities":[{"ticker":"TICKER","name":"Name","yield":"0.00%","summary":"..."}]}`;

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
                <span style="color:var(--amber)">${s.ticker}</span> | ${s.name}<br>
                <span style="color:var(--green)">Yield: ${s.yield}</span><br>
                <span style="font-size:10px; opacity:0.7;">${s.summary}</span>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = "Error loading credit data.";
    }
}

async function runEquityScreen() {
    const key = localStorage.getItem(STORAGE_KEY);
    const ticker = document.getElementById('eqInput').value.toUpperCase();
    if(!ticker) return;

    const mockData = [150 + Math.random()*10, 155, 148, 160, 158];
    initChart(`${ticker} Trend`, mockData);

    const prompt = `2-sentence outlook for ${ticker} on April 10, 2026. Focus on macro/oil impact.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        alert(data.candidates[0].content.parts[0].text);
    } catch (e) {
        alert("Equity connection failed.");
    }
}

function initChart(label, dataPoints) {
    const canvas = document.getElementById('equityChart');
    const ctx = canvas.getContext('2d');
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['9:30', '11:00', '1:00', '3:00', '4:00'],
            datasets: [{
                label: label,
                data: dataPoints,
                borderColor: '#00ff41',
                backgroundColor: 'rgba(0, 255, 65, 0.05)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: '#222' }, ticks: { color: '#666' } },
                x: { grid: { color: '#222' }, ticks: { color: '#666' } }
            }
        }
    });
}
