const { Storage } = require("@plasmohq/storage")

const storage = new Storage()

let mediaRecorder = null
let recordedChunks = []
let startTime = null
let targetDomain = null

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const url = new URL(tab.url)
    const storedDomain = await storage.get("targetDomain")

    if (url.hostname === storedDomain) {
      startRecording(tabId)
    }
  }
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  stopRecording()
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.name === "getRecordingStatus") {
    sendResponse({
      isRecording: !!mediaRecorder && mediaRecorder.state === "recording"
    })
  } else if (request.name === "startRecording") {
    startRecording(sender.tab.id)
  } else if (request.name === "stopRecording") {
    stopRecording()
  } else if (request.name === "setTargetDomain") {
    storage.set("targetDomain", request.domain)
  }
})

function startRecording(tabId) {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    return
  }

  chrome.tabCapture.capture({ video: true, audio: true }, (stream) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError)
      return
    }

    const mimeType = getSupportedMimeType()
    mediaRecorder = new MediaRecorder(stream, { mimeType })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      saveRecording()
    }

    mediaRecorder.start(1000)
    startTime = Date.now()
    chrome.action.setBadgeText({ text: "REC" })

    // Notify content script
    chrome.tabs.sendMessage(tabId, {
      type: "RECORDING_STATUS_UPDATE",
      isRecording: true
    })
  })
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop()
    mediaRecorder.stream.getTracks().forEach((track) => track.stop())
    chrome.action.setBadgeText({ text: "" })

    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "RECORDING_STATUS_UPDATE",
          isRecording: false
        })
      }
    })
  }
}

function saveRecording() {
  if (recordedChunks.length === 0) {
    console.error("No recorded data available.")
    return
  }

  const mimeType = getSupportedMimeType()
  const blob = new Blob(recordedChunks, { type: mimeType })
  const url = URL.createObjectURL(blob)
  const date = new Date()
  const extension = mimeType.includes("mp4") ? "mp4" : "webm"
  const filename = `recording-${date.getFullYear()}${(date.getMonth() + 1)
    .toString()
    .padStart(
      2,
      "0"
    )}${date.getDate().toString().padStart(2, "0")}-${date.getHours().toString().padStart(2, "0")}${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}.${extension}`

  chrome.downloads.download(
    {
      url: url,
      filename: filename,
      saveAs: false
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Download error:", chrome.runtime.lastError)
      }
      URL.revokeObjectURL(url)
    }
  )

  recordedChunks = []
  startTime = null
}

function getSupportedMimeType() {
  const types = [
    "video/mp4",
    "video/webm",
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9",
    "video/webm;codecs=h264"
  ]

  return (
    types.find((type) => MediaRecorder.isTypeSupported(type)) || "video/webm"
  )
}
