let recorder;
let chunks = [];
let url;

const start = (streamId) => {
  navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
    })
    .then((stream) => {
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        url = URL.createObjectURL(blob);
      };
      recorder.start();
    })
    .catch((error) => {
      console.error("Error accessing media devices.", error);
    });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.command) {
    case "start":
      start(message.streamId);
      break;
    case "stop":
      if (recorder) {
        recorder.stop();
      }
      break;
    case "play":
      sendResponse(url);
      break;
  }

  return true;
});
