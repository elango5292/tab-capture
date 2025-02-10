let recorder;
let data = [];
let tabId;
let supportedMimeType;

function detectSupportedMimeType() {
  const mimeTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  for (const mimeType of mimeTypes) {
    console.log("Checking MIME type:", mimeType);
    if (MediaRecorder.isTypeSupported(mimeType)) {
      console.log(`Supported MIME type found: ${mimeType}`);
      return mimeType;
    } else {
      console.log(`MIME type ${mimeType} not supported.`);
    }
  }

  console.warn("No supported MIME type found.");
  return null;
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.target === "offscreen") {
    if (message.action === "startCapture") {
      tabId = message.tabId;
      console.log("Start capture requested for tab:", tabId);
      supportedMimeType = detectSupportedMimeType();

      if (!supportedMimeType) {
        console.error("No supported MIME type found. Recording cannot start.");
        return;
      }

      try {
        const stream = await chrome.tabCapture.capture({
          audio: true,
          video: true,
          videoConstraints: {
            mandatory: {
              chromeMediaSource: "tab",
              chromeMediaSourceId: tabId.toString(),
            },
          },
        });
        console.log("Tab capture stream obtained successfully.");

        recorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
        console.log("MediaRecorder created with MIME type:", supportedMimeType);

        recorder.ondataavailable = (event) => {
          data.push(event.data);
          console.log(
            "Data available:",
            event.data.size,
            "Total data size:",
            data.length
          );
        };

        recorder.onstop = () => {
          console.log("Recording stopped. Total data chunks:", data.length);
          downloadRecording();
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start();
        console.log("Recorder started. State:", recorder.state);
      } catch (captureError) {
        console.error("Error during tab capture:", captureError);
      }
    } else if (message.action === "stopCapture") {
      console.log("Stop capture requested.");
      if (recorder && recorder.state === "recording") {
        console.log("Stopping recorder.");
        recorder.stop();
      } else {
        console.log("Recorder is not active, or doesn't exist.");
      }
    }
  }
});

function downloadRecording() {
  console.log("Download recording function called.");
  if (!supportedMimeType) {
    console.error("No supported MIME type available for download.");
    return;
  }

  if (data.length === 0) {
    console.warn("No data available for download.");
    return;
  }

  const blob = new Blob(data, {
    type: supportedMimeType,
  });
  console.log("Blob created. Size:", blob.size);

  if (blob.size === 0) {
    console.warn("Blob size is zero.");
    return;
  }

  const url = URL.createObjectURL(blob);
  console.log("Blob URL:", url);

  try {
    chrome.downloads.download({
      url: url,
      filename: `tab-recording-${Date.now()}.${getFileExtension(
        supportedMimeType
      )}`,
    });
    console.log("Download started successfully.");
  } catch (downloadError) {
    console.error("Error during download:", downloadError);
  }
  data = [];
}

function getFileExtension(mimeType) {
  if (
    mimeType === "video/webm;codecs=vp9,opus" ||
    mimeType === "video/webm;codecs=vp8,opus" ||
    mimeType === "video/webm"
  ) {
    return "webm";
  }
  return "webm";
}

// Send a message to the service worker to indicate that the offscreen document is ready
chrome.runtime.sendMessage({ target: "offscreen", action: "offscreenReady" });
