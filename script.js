async function go() {
    const key = localStorage.getItem(STORAGE_KEY);
    if (!key) return openModal();

    const query = document.getElementById('qi').value;
    const resultsContainer = document.getElementById('results');
    const btn = document.getElementById('runBtn');
    
    resultsContainer.innerHTML = '<div class="loading">Analyzing Markets...</div>';
    btn.disabled = true;

    // We add a more specific instruction to avoid safety triggers
    const systemPrompt = `You are a data assistant. Return JSON only. 
    Search for current 2026 market data for: ${query}. 
    Required filters: ${[...activeCrit].join(', ')}. 
    Format: {"securities":[{"ticker":"TICKER","name":"Name","type":"etf|equity","yield":"X.X%","summary":"...","stats":[{"label":"PE","value":"15","tone":"pos"}]}]}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.1 // Lower temperature for more stable JSON
                }
            })
        });

        const data = await response.json();

        // CHECK 1: Did the API return an error (like Invalid Key)?
        if (data.error) {
            throw new Error(data.error.message);
        }

        // CHECK 2: Did the API refuse to answer (Safety/Blocked)?
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error("The AI blocked this request. Try phrasing it differently (e.g., 'Search for ticker data for...')");
        }

        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        
        if (!result.securities || result.securities.length === 0) {
            resultsContainer.innerHTML = `<div class="err">No securities found matching those criteria.</div>`;
        } else {
            renderResults(result.securities);
        }

    } catch (err) {
        console.error(err);
        resultsContainer.innerHTML = `
            <div class="err">
                <div class="err-label">Terminal Error</div>
                ${err.message}
            </div>`;
    } finally {
        btn.disabled = false;
    }
}
