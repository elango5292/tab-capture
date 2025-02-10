async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Update UI based on recording status
async function updateStatus() {
  const tab = await getCurrentTab();
  chrome.tabs.sendMessage(tab.id, { action: "getStatus" });
}

// Listen for status updates
chrome.runtime.onMessage.addListener((message) => {
  const statusDiv = document.getElementById("status");
  if (message.status === "recording") {
    statusDiv.textContent = "Recording in progress...";
  } else if (message.status === "idle") {
    statusDiv.textContent = "Not recording";
  } else if (message.status === "error") {
    statusDiv.textContent = "Error: " + message.error;
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", updateStatus);

// Stop recording button
document.getElementById("stopRecording").addEventListener("click", async () => {
  const tab = await getCurrentTab();
  chrome.tabs.sendMessage(tab.id, { action: "stopRecording" });
  window.close();
});
