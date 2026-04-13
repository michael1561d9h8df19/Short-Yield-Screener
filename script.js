const STORAGE_KEY = 'gemini_api_key';
const MODEL = 'gemini-1.5-flash-latest'; // Updated for April 2026 stability

// INITIAL LOAD
window.onload = () => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('conn-status').textContent = "STATUS: CONNECTED";
        initDashboard();
    }
};

function saveKey() {
    const val = document.getElementById('keyInput').value.trim();
    if (val) {
        localStorage.setItem(STORAGE_KEY, val);
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('conn-status').textContent = "STATUS: CONNECTED";
        initDashboard();
    }
}

function initDashboard() {
    fetchNews();
    fetchCNBC();
    initChart('Benchmark Pulse', [430, 432, 429, 431, 433]);
}

async function fetchCNBC() {
    const container = document.getElementById('cnbc-content');
    const rssUrl = 'https://www.cnbc.com/id/100003114/device/rss/rss.html';
    const bridgeUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(bridgeUrl);
        const data = await response.json();
        container.innerHTML = data.items.slice(0, 5).map(item => `
            <div class="news-item">
                <a href="${item.link}" target="_blank" style="color:#00ff41; text-decoration:none;">
                    <strong>[LATEST]</strong> ${item.title}
                </a>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = "CNBC Stream Offline.";
    }
}

async function fetchNews() {
    const key = localStorage.getItem(STORAGE_KEY);
    const container = document.getElementById('news-content');
    const prompt = `Provide 3 headlines for April 13, 2026. Focus: TSM revenue surge, US-Iran ceasefire impact on oil. Format: <div class="news-item"><strong>AI:</strong> [Headlines]</div>`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        container.innerHTML = data.candidates[0].content.parts[0].text;
    } catch (e) { container.innerHTML = "AI Feed Busy."; }
}

async function runEquityScreen() {
    const ticker = document.getElementById('eqInput').value.toUpperCase();
    if(!ticker) return;

    // To use actual prices, replace 'DEMO' with your Alpha Vantage Key
    const avKey = 'DEMO'; 
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=5min&apikey=${avKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Check if we got real data or the daily limit message
        if (data["Time Series (5min)"]) {
            const timeSeries = data["Time Series (5min)"];
            const labels = Object.keys(timeSeries).slice(0, 10).reverse();
            const prices = labels.map(time => parseFloat(timeSeries[time]["1. open"]));
            initChart(`${ticker} Real Price`, prices, labels.map(l => l.split(' ')[1]));
        } else {
            // Fallback to stylized mock if limit reached
            const mock = [150, 155, 148, 160, 158];
            initChart(`${ticker} (Daily Limit Reached)`, mock);
        }
    } catch (e) {
        alert("Feed limit reached.");
    }
}

function initChart(label, dataPoints, timeLabels) {
    const ctx = document.getElementById('equityChart').getContext('2d');
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels || ['9:30', '11:00', '1:00', '3:00', '4:00'],
            datasets: [{
                label: label,
                data: dataPoints,
                borderColor: '#00ff41',
                backgroundColor: 'rgba(0, 255, 65, 0.05)',
                fill: true,
                tension: 0.3
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

function qs(text) {
    document.getElementById('qi').value = text;
    go();
}

async function go() {
    const key = localStorage.getItem(STORAGE_KEY);
    const container = document.getElementById('results');
    container.innerHTML = 'FETCHING DATA...';

    const prompt = `Senior Credit Analyst view. USER REQUEST: ${document.getElementById('qi').value}. Return ONLY JSON: {"securities":[{"ticker":"TICKER","name":"Name","yield":"0.00%","summary":"..."}]}`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
        });
        const data = await res.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        container.innerHTML = result.securities.map(s => `<div class="sec-card"><strong>${s.ticker}</strong> | ${s.name}<br>Yield: ${s.yield}<br><span style="font-size:10px;">${s.summary}</span></div>`).join('');
    } catch (e) { container.innerHTML = "Screener error."; }
}
