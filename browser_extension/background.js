chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_ANALYSIS") {
    // Make the fetch request from the background script to bypass the website's Content Security Policy
    fetch('http://127.0.0.1:8001/analyze_reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reviews: request.reviews })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      sendResponse({ data: data });
    })
    .catch(error => {
      console.error("Cortex background fetch error:", error);
      sendResponse({ error: error.message });
    });

    // Return true to indicate we will send a response asynchronously
    return true;
  }
});
