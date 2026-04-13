const STORAGE_KEY = 'gemini_api_key';
const AV_KEY = 'BWJ1JNTXCQPBKSNH'; // Your Active Alpha Vantage Key
const MODEL = 'gemini-1.5-flash-latest';

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
    fetchCNBC();
    // Delay the AI calls slightly to avoid hitting the 429 rate limit on page load
    setTimeout(fetchNews, 1000); 
    initChart('Market Pulse', [430.12, 431.55, 429.80, 432.10, 431.90]);
}

async function fetchCNBC() {
    const container = document.getElementById('cnbc-content');
    // Using a reliable RSS-to-JSON bridge
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
    
    // Minimalist prompt to save tokens and prevent "Busy" errors
    const prompt = "April 13, 2026: 3 bullet points on semi-conductor market sentiment. No intro.";

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        
        if (data.candidates && data.candidates[0].content) {
            container.innerHTML = `<div class="news-item" style="color:#aaa;">${data.candidates[0].content.parts[0].text}</div>`;
        } else {
            container.innerHTML = "AI Macro Feed: Rate Limit Reached.";
        }
    } catch (e) { 
        container.innerHTML = "AI Feed Offline."; 
    }
}

async function runEquityScreen() {
    const ticker = document.getElementById('eqInput').value.toUpperCase();
    if(!ticker) return;

    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=5min&apikey=${AV_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data["Time Series (5min)"]) {
            const timeSeries = data["Time Series (5min)"];
            const labels = Object.keys(timeSeries).slice(0, 15).reverse();
            const prices = labels.map(time => parseFloat(timeSeries[time]["1. open"]));
            const shortLabels = labels.map(l => l.split(' ')[1].substring(0, 5));
            
            initChart(`${ticker} LIVE (5m)`, prices, shortLabels);
        } else {
            alert("Alpha Vantage Limit: 25 requests per day. Showing fallback data.");
            initChart(`${ticker} (Daily Limit)`, [150, 152, 149, 155, 154]);
        }
    } catch (e) {
        console.error(e);
    }
}

function initChart(label, dataPoints, timeLabels) {
    const ctx = document.getElementById('equityChart').getContext('2d');
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels || ['09:30', '11:00', '13:00', '15:00', '16:00'],
            datasets: [{
                label: label,
                data: dataPoints,
                borderColor: '#00ff41',
                backgroundColor: 'rgba(0, 255, 65, 0.05)',
                fill: true,
                tension: 0.3,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: '#222' }, ticks: { color: '#666', font: { size: 10 } } },
                x: { grid: { color: '#222' }, ticks: { color: '#666', font: { size: 10 } } }
            },
            plugins: {
                legend: { labels: { color: '#e0e0e0', font: { family: 'Courier New' } } }
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
    container.innerHTML = '<div style="color:var(--amber); font-size:11px;">PARSING FINANCIAL DATA...</div>';

    // Added a very strict "No Markdown" instruction to prevent Screener errors
    const prompt = `Task: ${document.getElementById('qi').value}. Return ONLY a JSON object. No words, no backticks. 
    Format: {"securities":[{"ticker":"TICKER","name":"Name","yield":"0.00%","summary":"..."}]}`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });
        const data = await res.json();
        
        // Safety check for JSON structure
        if (data.candidates && data.candidates[0].content) {
            const rawText = data.candidates[0].content.parts[0].text;
            const result = JSON.parse(rawText);
            
            container.innerHTML = result.securities.map(s => `
                <div class="sec-card">
                    <strong style="color:var(--amber)">${s.ticker}</strong> | ${s.name}<br>
                    <span style="color:var(--green)">Yield: ${s.yield}</span><br>
                    <span style="font-size:10px; color:#aaa;">${s.summary}</span>
                </div>
            `).join('');
        }
    } catch (e) { 
        console.error(e);
        container.innerHTML = "<div class='sec-card'>Screener Busy. Please wait 30s for API cool-down.</div>"; 
    }
}
