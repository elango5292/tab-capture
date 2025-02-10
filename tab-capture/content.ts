import { sendToBackground } from "@plasmohq/messaging"

const config = {
  matches: ["<all_urls>"]
}

console.log("Content script loaded")

const statusElement = document.createElement("div")
statusElement.id = "recording-status"
Object.assign(statusElement.style, {
  position: "fixed",
  top: "10px",
  right: "10px",
  padding: "5px 10px",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  color: "white",
  borderRadius: "5px",
  zIndex: "9999",
  display: "none"
})
document.body.appendChild(statusElement)

sendToBackground({ name: "getRecordingStatus" }).then((response) => {
  updateRecordingStatus(response.isRecording)
})

function updateRecordingStatus(isRecording) {
  statusElement.textContent = isRecording ? "Recording" : ""
  statusElement.style.display = isRecording ? "block" : "none"
}

window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "RECORDING_STATUS_UPDATE") {
    updateRecordingStatus(event.data.isRecording)
  }
})
