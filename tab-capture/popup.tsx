import { useEffect, useState } from "react"

import "./style.css"

export default function IndexPopup() {
  const [isRecording, setIsRecording] = useState(false)
  const [timer, setTimer] = useState("00:00")
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)

  const getSupportedMimeType = () => {
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

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const minutes = Math.floor(elapsed / 60)
          .toString()
          .padStart(2, "0")
        const seconds = (elapsed % 60).toString().padStart(2, "0")
        setTimer(`${minutes}:${seconds}`)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, startTime])

  const startRecording = async () => {
    try {
      const stream = await new Promise<MediaStream>((resolve, reject) => {
        chrome.tabCapture.capture(
          {
            video: true,
            audio: true
          },
          (stream) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve(stream)
            }
          }
        )
      })

      const mimeType = getSupportedMimeType()
      const recorder = new MediaRecorder(stream, { mimeType })

      let recordedChunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        console.log("Chunk received:", event.data.size)
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        if (recordedChunks.length === 0) {
          console.error("No recorded data available.")
          return
        }

        const blob = new Blob(recordedChunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        const date = new Date()
        const extension = mimeType.includes("mp4") ? "mp4" : "webm"
        const filename = `recording-${date.getFullYear()}${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}-${date
          .getHours()
          .toString()
          .padStart(2, "0")}${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}.${extension}`

        chrome.downloads.download(
          {
            url: url,
            filename: filename,
            saveAs: true
          },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error("Download error:", chrome.runtime.lastError)
            }
            URL.revokeObjectURL(url)
          }
        )

        setTimer("00:00")
        setIsRecording(false)
        setStartTime(null)
      }

      recorder.start(1000)
      setMediaRecorder(recorder)
      setStartTime(Date.now())
      setIsRecording(true)
    } catch (err) {
      console.error("Error starting recording:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach((track) => track.stop())
    }
  }

  return (
    <div className="popup">
      <div
        className="timer"
        style={{ display: isRecording ? "block" : "none" }}>
        {timer}
      </div>
      {!isRecording ? (
        <button onClick={startRecording} className="button">
          Start Recording
        </button>
      ) : (
        <button onClick={stopRecording} className="button stop">
          Stop Recording
        </button>
      )}
    </div>
  )
}
