const STORAGE_KEY = 'gemini_api_key';
const MODEL = 'gemini-flash-latest';

window.onload = () => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (!savedKey || savedKey === "") {
        document.getElementById('overlay').classList.remove('hidden');
        document.getElementById('key-status').textContent = "KEY: MISSING";
        document.getElementById('key-status').style.color = "red";
    } else {
        initDashboard();
    }
};

function saveKey() {
    const val = document.getElementById('keyInput').value.trim();
    if (val) {
        localStorage.setItem(STORAGE_KEY, val);
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('key-status').textContent = "KEY: CONNECTED";
        document.getElementById('key-status').style.color = "#00ff41";
        initDashboard(); // Trigger the boot sequence
    }
}

function initDashboard() {
    fetchNews();
    initChart('Benchmark Pulse', [430.1, 432.5, 428.9, 431.2, 433.8]);
}

function qs(text) {
    document.getElementById('qi').value = text;
    go();
}

async function fetchNews() {
    const key = localStorage.getItem(STORAGE_KEY);
    const container = document.getElementById('news-content');
    const today = "Friday, April 10, 2026";

    const prompt = `Act as a Bloomberg News anchor. Provide 5 headlines for ${today}. 
    Focus on: Iran-Israel de-escalation, Oil plunging to $96.50, and 10Y Treasury dipping to 4.31%.
    Format: <div class="news-item"><strong>[HEADLINE]</strong>[1 sentence summary]</div>`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        container.innerHTML = data.candidates[0].content.parts[0].text;
    } catch (e) {
        container.innerHTML = "<div style='color:red'>NEWS ERROR: Please check your API Key and billing status.</div>";
    }
}

async function go() {
    const key = localStorage.getItem(STORAGE_KEY);
    const today = "Friday, April 10, 2026";
    let input = document.getElementById('qi').value;
    const container = document.getElementById('results');
    
    container.innerHTML = '<div style="color:var(--amber); font-size:12px;">QUERYING CREDIT DESK...</div>';

    const prompt = `Senior Credit Analyst view for ${today}. 
    USER REQUEST: ${input}.
    CURRENT MARKET: 10Y Treasury 4.31%, 2Y 3.79%, SPSB 4.45%, MUB 3.38%.
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
                <span style="color:var(--amber); font-weight:bold;">${s.ticker}</span> | ${s.name}<br>
                <span style="color:var(--green); font-size:14px;">Yield: ${s.yield}</span>
                <p style="margin:8px 0 0 0; color:#aaa; font-style:italic;">${s.summary}</p>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = "<div class='sec-card' style='border-left-color:red'>CREDIT DATA OFFLINE. Check key in AI Studio.</div>";
    }
}

async function runEquityScreen() {
    const key = localStorage.getItem(STORAGE_KEY);
    const ticker = document.getElementById('eqInput').value.toUpperCase();
    if(!ticker) return;

    // Chart update
    const mockData = [180 + Math.random()*10, 185, 178, 192, 190];
    initChart(`${ticker} (Mock Trend)`, mockData);

    const prompt = `Provide a 2-sentence investment thesis for ${ticker} as of April 10, 2026. Focus on its sensitivity to the current $96 oil price environment.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        alert(`ANALYST REPORT (${ticker}):\n\n${data.candidates[0].content.parts[0].text}`);
    } catch (e) {
        alert("Equity connection lost.");
    }
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
                backgroundColor: 'rgba(0, 255, 65, 0.05)',
                fill: true,
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, labels: { color: '#888' } } },
            scales: {
                y: { grid: { color: '#222' }, ticks: { color: '#666' } },
                x: { grid: { color: '#222' }, ticks: { color: '#666' } }
            }
        }
    });
}
