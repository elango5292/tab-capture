let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

startRecording();

function getSupportedMimeTypes() {
  const possibleTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/mp4;codecs=h264,aac",
    "video/webm",
    "video/mp4",
  ];

  return possibleTypes.filter((mimeType) => {
    return MediaRecorder.isTypeSupported(mimeType);
  });
}

function getFileExtension(mimeType) {
  if (mimeType.includes("mp4")) return ".mp4";
  if (mimeType.includes("webm")) return ".webm";
  return ".webm"; // default fallback
}

async function startRecording() {
  if (isRecording) return;

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { mediaSource: "screen" },
      audio: true,
    });

    // Get supported MIME types and select the first one
    const supportedTypes = getSupportedMimeTypes();
    if (supportedTypes.length === 0) {
      throw new Error("No supported MIME types found");
    }

    const selectedMimeType = supportedTypes[0];
    console.log("Using MIME type:", selectedMimeType);

    const options = {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 3000000, // 3 Mbps
    };

    mediaRecorder = new MediaRecorder(stream, options);
    isRecording = true;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: selectedMimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Get appropriate file extension based on MIME type
      const fileExtension = getFileExtension(selectedMimeType);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `screen-recording-${timestamp}${fileExtension}`;

      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      recordedChunks = [];
      isRecording = false;
    };

    // Set a reasonable timeslice for data availability (1 second)
    mediaRecorder.start(1000);

    // Add recording information to status
    const statusInfo = {
      status: "recording",
      mimeType: selectedMimeType,
      videoBitrate: options.videoBitsPerSecond,
    };
    chrome.runtime.sendMessage(statusInfo);
  } catch (err) {
    console.error("Error:", err);
    isRecording = false;
    chrome.runtime.sendMessage({ status: "error", error: err.message });
  }
}

// Listen for stop command from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "stopRecording" && mediaRecorder && isRecording) {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
  } else if (message.action === "getStatus") {
    chrome.runtime.sendMessage({ status: isRecording ? "recording" : "idle" });
  }
});
