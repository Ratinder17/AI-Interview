import React, { useEffect, useRef } from "react";
import Recorder from "recorder-js";
import axios from "axios";

const MicStreamer = ({ question }) => {
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isAudioPlayingRef = useRef(false); // 🆕 NEW GUARD

  const startInteraction = async () => {
    if (isProcessingRef.current || isAudioPlayingRef.current) return;
    isProcessingRef.current = true;

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
        try {
          const { blob: wavBlob } = await recorderRef.current.stop();
          stream.getTracks().forEach((track) => track.stop());

          const formData = new FormData();
          formData.append("audio", wavBlob, "recording.wav");

          const response = await axios.post(
            "http://localhost:4000/api/transcribe",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );

          const transcript = response.data.transcript;
          console.log("Transcript:", transcript);

          if (!transcript || transcript.trim().length < 2) {
            console.warn("🛑 Skipping empty or short transcript");
            isProcessingRef.current = false;
            startInteraction();
            return;
          }

          const aiRes = await axios.post("http://localhost:4000/api/openai", {
            transcript,
            question,
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

          isAudioPlayingRef.current = true;

          finalAudio.onended = () => {
            isAudioPlayingRef.current = false;
            isProcessingRef.current = false;
            console.log("🔁 Restarting recording...");
            startInteraction();
          };

          finalAudio.onerror = () => {
            console.error("🎵 Audio playback failed");
            isAudioPlayingRef.current = false;
            isProcessingRef.current = false;
            startInteraction();
          };

          finalAudio.play().catch((err) => {
            console.error("Playback error:", err);
            isAudioPlayingRef.current = false;
            isProcessingRef.current = false;
            startInteraction();
          });
        } catch (err) {
          console.error("🔴 Interaction inner error:", err);
          isProcessingRef.current = false;
          startInteraction(); // retry interaction on error
        }
      }, 3000); // optional: 6000ms if you're not using VAD
    } catch (err) {
      console.error("Mic access error:", err);
      isProcessingRef.current = false;
      setTimeout(() => {
        console.log("🔁 Retrying mic access after failure");
        startInteraction();
      }, 9000);
    }
  };

  useEffect(() => {
    const safeStart = async () => {
      try {
        await startInteraction();
      } catch (err) {
        console.error("💥 Interaction crashed:", err);
        setTimeout(() => {
          console.log("🔁 Retrying interaction after crash");
          safeStart(); // recursive retry on top-level crash
        }, 9000);
      }
    };

    safeStart();

    return () => {
      if (recorderRef.current) recorderRef.current.stop();
    };
  }, []);

  return null; // this component doesn't render anything
};

export default MicStreamer;

/*

*/
