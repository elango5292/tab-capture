// recorder.js
let frames = [];
let isRecording = false;
let recordingInterval;
const FPS = 1;

window.startRecording = function () {
  console.log("Starting recording...");
  isRecording = true;
  frames = [];
  recordingInterval = setInterval(() => {
    if (typeof html2canvas !== "undefined") {
      html2canvas(document.body).then((canvas) => {
        frames.push(canvas.toDataURL("image/jpeg", 0.5));
      });
    }
  }, 1000 / FPS);
};

window.stopRecording = function () {
  console.log("Stopping recording...");
  isRecording = false;
  clearInterval(recordingInterval);

  const video = document.createElement("video");
  const stream = video.captureStream();
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
  });
  const chunks = [];

  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    window.postMessage({ type: "RECORDING_COMPLETE", url: url }, "*");
  };

  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  let i = 0;

  function addFrame() {
    if (i < frames.length) {
      let img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        mediaRecorder.requestData();
        i++;
        setTimeout(addFrame, 1000 / FPS);
      };
      img.src = frames[i];
    } else {
      mediaRecorder.stop();
    }
  }

  addFrame();
};
