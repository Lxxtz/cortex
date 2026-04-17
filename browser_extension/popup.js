document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const statusMsg = document.getElementById('statusMsg');
  statusMsg.innerText = "Initiating analysis...";
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script to trigger analysis
    chrome.tabs.sendMessage(tab.id, { action: "TRIGGER_ANALYSIS" }, (response) => {
      if (chrome.runtime.lastError) {
        statusMsg.innerText = "Error: Please refresh the page and try again.";
        return;
      }
      if (response && response.status === 'started') {
        statusMsg.innerText = "Analysis started! Check the page.";
      } else {
        statusMsg.innerText = "Failed to start analysis.";
      }
    });
  } catch (error) {
    statusMsg.innerText = "Error: " + error.message;
  }
});
