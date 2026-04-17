// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TRIGGER_ANALYSIS") {
    startAnalysis();
    sendResponse({ status: "started" });
  }
  return true;
});

function startAnalysis() {
  if (window.hasCortexInjected) return;
  window.hasCortexInjected = true;

  console.log("Cortex AI: Starting review extraction...");

  // Selectors for Amazon and Flipkart
  const selectors = [
    '.review-text-content span', // Amazon
    '.t-ZTKy div div',           // Flipkart
    '.review-text'               // Generic fallback
  ];

  let reviewElements = [];
  for (const selector of selectors) {
    const els = document.querySelectorAll(selector);
    if (els.length > 0) {
      reviewElements = Array.from(els);
      break;
    }
  }

  if (reviewElements.length === 0) {
    alert("Cortex AI: No reviews found on this page to analyze.");
    window.hasCortexInjected = false;
    return;
  }

  // Inject CSS if not already injected
  if (!document.getElementById('cortex-styles')) {
    const style = document.createElement('style');
    style.id = 'cortex-styles';
    style.innerHTML = `
      #cortex-global-summary {
        margin: 20px;
        padding: 16px;
        background-color: #f5f0e8;
        border: 1px solid rgba(180, 170, 150, 0.3);
        border-radius: 8px;
        color: #1c1710;
        font-family: "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(28, 23, 16, 0.08);
        z-index: 999999;
        position: relative;
      }
      .cortex-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(180, 170, 150, 0.3);
        padding-bottom: 8px;
      }
      .cortex-header h3 {
        margin: 0;
        font-size: 16px;
        color: #1c1710;
        flex-grow: 1;
        font-weight: 700;
      }
      .cortex-badge {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 12px;
        background-color: #ebe5db;
        color: #1c1710;
        font-weight: bold;
      }
      .cortex-summary-content {
        font-size: 14px;
        line-height: 1.5;
        color: #5c5347;
      }
      .cortex-review-badge {
        margin-top: 8px;
        margin-bottom: 16px;
        font-family: "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .cortex-emotion {
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cortex-conf {
        font-size: 11px;
        opacity: 0.8;
        margin-left: 6px;
      }
      .cortex-aspects {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
      }
      .cortex-aspect {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid;
        background-color: #fdfaf5;
      }
      /* Loading Bar Styles */
      .cortex-loading-container {
        width: 100%;
        background-color: #ebe5db;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 10px;
        height: 6px;
      }
      .cortex-loading-bar {
        height: 100%;
        width: 30%;
        background-color: #8b6914;
        animation: cortex-loading 1.5s infinite ease-in-out;
        border-radius: 4px;
      }
      @keyframes cortex-loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }
    `;
    document.head.appendChild(style);
  }

  // Create global summary container at the top
  const summaryContainer = document.createElement('div');
  summaryContainer.id = 'cortex-global-summary';
  summaryContainer.innerHTML = `
    <div class="cortex-header">
      <h3>Cortex AI Global Analysis</h3>
      <span class="cortex-badge" id="cortex-main-badge" style="background-color: rgba(154, 123, 48, 0.2); color: #9a7b30;">Processing...</span>
    </div>
    <div class="cortex-summary-content" id="cortex-summary-text">
      Extracting and sending ${reviewElements.length} reviews to Local AI Backend...
      <div class="cortex-loading-container" id="cortex-loader">
        <div class="cortex-loading-bar"></div>
      </div>
    </div>
  `;
  document.body.insertBefore(summaryContainer, document.body.firstChild);

  // Extract text
  const reviewsText = reviewElements.map(el => el.innerText.trim()).filter(text => text.length > 10);

  // Send messages in batches to avoid overwhelming the local LLM
  const BATCH_SIZE = 8;
  let allAnalyses = [];
  let globalSummaries = [];
  let hasError = false;

  for (let i = 0; i < reviewsText.length; i += BATCH_SIZE) {
    if (hasError) break;
    
    const batch = reviewsText.slice(i, i + BATCH_SIZE);
    document.getElementById('cortex-summary-text').innerHTML = `
      Extracting and sending ${reviewElements.length} reviews to Local AI Backend...<br>
      <span style="color:#5a6e3a">Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(reviewsText.length/BATCH_SIZE)}...</span>
      <div class="cortex-loading-container" id="cortex-loader">
        <div class="cortex-loading-bar"></div>
      </div>
    `;

    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "FETCH_ANALYSIS", reviews: batch }, resolve);
      });

      if (!response || response.error) {
        hasError = true;
        const errMsg = response && response.error ? response.error : "Unknown error";
        document.getElementById('cortex-summary-text').innerHTML = `<span style="color:#b33a2a">Error communicating with local AI backend: <b>${errMsg}</b></span><br>Make sure main.py is running on port 8001.`;
        document.getElementById('cortex-main-badge').innerText = 'Error';
        document.getElementById('cortex-main-badge').style.backgroundColor = '#b33a2a';
        document.getElementById('cortex-main-badge').style.color = '#fff';
        window.hasCortexInjected = false;
        return;
      }

      allAnalyses.push(...response.data.reviews_analysis);
      if (response.data.global_summary) {
        globalSummaries.push(response.data.global_summary);
      }
    } catch (e) {
      hasError = true;
      document.getElementById('cortex-summary-text').innerHTML = `<span style="color:#b33a2a">Extension Error: <b>${e.message}</b></span>`;
      window.hasCortexInjected = false;
      return;
    }
  }

  if (hasError) return;

  const finalSummary = globalSummaries.join(" ");

  // Update global summary
  document.getElementById('cortex-summary-text').innerHTML = `
    <p style="margin: 0; font-weight: bold; color: #8b6914; margin-bottom: 8px;">Analysis Complete</p>
    <p style="margin: 0; color: #5c5347;">${finalSummary}</p>
  `;
  document.getElementById('cortex-main-badge').innerText = 'Done';
  document.getElementById('cortex-main-badge').style.backgroundColor = 'rgba(139, 105, 20, 0.2)';
  document.getElementById('cortex-main-badge').style.color = '#8b6914';

  // Inject individual review badges
  allAnalyses.forEach((analysis, index) => {
    if (index < reviewElements.length) {
      const el = reviewElements[index];
      const badgeDiv = document.createElement('div');
      badgeDiv.className = 'cortex-review-badge';
      
      let emotionColor = '#9a7b30'; // Neutral
      if (analysis.emotion.includes('Positive')) emotionColor = '#8b6914';
      if (analysis.emotion.includes('Negative')) emotionColor = '#b33a2a';
      if (analysis.emotion.includes('Mixed')) emotionColor = '#5a6e3a';

      let aspectsHtml = '';
      if (analysis.aspects && analysis.aspects.length > 0) {
        aspectsHtml = '<div class="cortex-aspects">';
        analysis.aspects.forEach(a => {
          const aColor = a.sentiment.toLowerCase() === 'positive' ? '#8b6914' : 
                         a.sentiment.toLowerCase() === 'negative' ? '#b33a2a' : '#9a7b30';
          aspectsHtml += `<span class="cortex-aspect" style="border-color: ${aColor}; color: ${aColor}">${a.feature}</span>`;
        });
        aspectsHtml += '</div>';
      }

      badgeDiv.innerHTML = `
        <div class="cortex-emotion" style="background-color: ${emotionColor}22; border-left: 4px solid ${emotionColor};">
          <span style="color: ${emotionColor}; font-weight: bold;">${analysis.emotion}</span>
          <span class="cortex-conf">(${(analysis.confidence_score * 100).toFixed(0)}% AI Confidence)</span>
          ${aspectsHtml}
        </div>
      `;
      
      el.style.borderLeft = `3px solid ${emotionColor}`;
      el.style.paddingLeft = '10px';
      el.parentNode.insertBefore(badgeDiv, el.nextSibling);
    }
  });
}
