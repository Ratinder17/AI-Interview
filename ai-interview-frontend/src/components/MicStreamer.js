import React, { useEffect, useRef } from "react";
import Recorder from "recorder-js";
import axios from "axios";

const MicStreamer = ({ question }) => {
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);

  const startInteraction = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      const recorder = new Recorder(audioContextRef.current, {
        numChannels: 1,
      });
      await recorder.init(stream);
      await recorder.start();
      recorderRef.current = recorder;

      setTimeout(async () => {
        const { blob: wavBlob } = await recorderRef.current.stop();
        stream.getTracks().forEach((track) => track.stop());

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

          if (!transcript || transcript.trim().length < 2) {
            console.warn("🛑 Skipping empty or short transcript");
            startInteraction(); // retry recording
            return;
          }

          const aiRes = await axios.post("http://localhost:4000/api/openai", {
            transcript,
            question, // full question object with title and problemStatement
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

          finalAudio.onended = () => {
            console.log("🔁 Restarting recording...");
            startInteraction();
          };

          finalAudio.play();
        } catch (err) {
          console.error("Transcription or AI error:", err);
        }
      }, 3000);
    } catch (err) {
      console.error("Mic access error:", err);
    }
  };

  useEffect(() => {
    startInteraction();

    return () => {
      if (recorderRef.current) recorderRef.current.stop();
    };
  }, []);

  return (
    <p style={{ color: "green" }}>🎙️ Listening for your next response...</p>
  );
};

export default MicStreamer;
