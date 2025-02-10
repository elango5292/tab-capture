chrome.webNavigation.onCompleted.addListener(
  (details) => {
    chrome.tabs.get(details.tabId, (tab) => {
      if (tab.url && tab.url.includes("google.com")) {
        console.log("Google.com loaded, injecting script...");
        chrome.tabs.executeScript(details.tabId, { file: "content.js" }, () => {
          if (chrome.runtime.lastError) {
            console.error("Script injection error:", chrome.runtime.lastError);
          }
        });
      }
    });
  },
  { url: [{ hostContains: "google.com" }] }
);
