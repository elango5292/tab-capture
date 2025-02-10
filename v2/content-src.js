const html2canvas = require("html2canvas");

console.log("Content script loaded on Google.com!");

document.body.style.border = "5px solid red";
(async function () {
  console.log("Recording started...");

  let images = [];
  let recordingTime = 1000;
  let frameRate = 10; // 10 FPS
  let totalFrames = frameRate * (recordingTime / 1000);

  let element = document.body;

  for (let i = 0; i < totalFrames; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000 / frameRate));

    html2canvas(element).then((canvas) => {
      images.push(canvas.toDataURL("image/webp"));
    });
  }

  console.log("Recording finished, generating video...");

  setTimeout(() => generateVideo(images, frameRate), 1000);
})();

function generateVideo(images, frameRate) {
  let video = document.createElement("video");
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");

  let img = new Image();
  img.src = images[0];

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    let stream = canvas.captureStream(frameRate);
    let mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    let chunks = [];

    mediaRecorder.ondataavailable = (event) => chunks.push(event.data);
    mediaRecorder.onstop = () => {
      let blob = new Blob(chunks, { type: "video/webm" });
      let url = URL.createObjectURL(blob);
      let a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm";
      a.click();
    };

    mediaRecorder.start();

    let i = 0;
    let interval = setInterval(() => {
      if (i >= images.length) {
        clearInterval(interval);
        mediaRecorder.stop();
        return;
      }
      img.src = images[i++];
      ctx.drawImage(img, 0, 0);
    }, 1000 / frameRate);
  };
}
