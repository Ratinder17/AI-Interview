import React, { useEffect, useRef } from "react";
import Recorder from "recorder-js";
import axios from "axios";

const MicStreamer = () => {
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);
  const hasSentRef = useRef(false); // Prevent multiple sends

  useEffect(() => {
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        const recorder = new Recorder(audioContextRef.current, {
          numChannels: 1,
        });
        await recorder.init(stream);
        await recorder.start();
        recorderRef.current = recorder;

        intervalRef.current = setInterval(async () => {
          if (!recorderRef.current || hasSentRef.current) return;

          hasSentRef.current = true;

          const { blob: wavBlob } = await recorderRef.current.stop();
          stream.getTracks().forEach((track) => track.stop());

          // Prepare form data
          const formData = new FormData();
          formData.append("audio", wavBlob, "recording.wav");

          try {
            const response = await axios.post(
              "http://localhost:4000/api/transcribe",
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              }
            );

            const transcript = response.data.transcript;
            console.log("Transcript:", transcript);

            const aiRes = await axios.post("http://localhost:4000/api/openai", {
              prompt: transcript,
            });

            const aiReply = aiRes.data.reply;
            console.log("AI replied:", aiReply);

            const ttsRes = await fetch("http://localhost:4000/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: aiReply }),
            });

            const audioBlob = await ttsRes.blob();
            const audioURL = URL.createObjectURL(audioBlob);
            const finalAudio = new Audio(audioURL);
            finalAudio.play();
          } catch (err) {
            console.error("Transcription or AI error:", err);
          }

          clearInterval(intervalRef.current); // Stop after first send
        }, 3000);
      } catch (err) {
        console.error("Mic access error:", err);
      }
    };

    startRecording();

    return () => {
      clearInterval(intervalRef.current);
      if (recorderRef.current) recorderRef.current.stop();
    };
  }, []);

  return (
    <p style={{ color: "green" }}>
      🎙️ Listening and sending audio to server...
    </p>
  );
};

export default MicStreamer;
