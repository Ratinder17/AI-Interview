import React, { useEffect, useRef } from "react";
import Recorder from "recorder-js";
import axios from "axios";

const MicStreamer = ({ question, muted }) => {
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const recordingStartedRef = useRef(false);

  const cleanup = () => {
    if (recorderRef.current) {
      recorderRef.current.stop().catch(() => {});
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recordingStartedRef.current = false;
  };

  const startRecording = async () => {
    if (recordingStartedRef.current || muted) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      const recorder = new Recorder(audioContextRef.current, {
        numChannels: 1,
      });

      await recorder.init(stream);
      await recorder.start();
      recorderRef.current = recorder;
      recordingStartedRef.current = true;

      console.log("🎙️ Recording started...");
    } catch (err) {
      console.error("🎤 Mic error:", err);
    }
  };

  const stopRecordingAndProcess = async () => {
    if (!recordingStartedRef.current || !recorderRef.current) return;

    try {
      const { blob: wavBlob } = await recorderRef.current.stop();
      cleanup();
      console.log("🛑 Recording stopped. Processing audio...");

      const formData = new FormData();
      formData.append("audio", wavBlob, "recording.wav");

      const response = await axios.post(
        "http://localhost:4000/api/transcribe",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const transcript = response.data.transcript;
      console.log("📝 Transcript:", transcript);

      if (!transcript || transcript.trim().length < 2) {
        console.warn("Empty transcript");
        return;
      }

      const aiRes = await axios.post("http://localhost:4000/api/openai", {
        transcript,
        question,
      });

      const aiReply = aiRes.data.reply;
      console.log("🤖 AI Reply:", aiReply);

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
      console.error("❌ Error in stop-and-process:", err);
    }
  };

  useEffect(() => {
    if (!muted) {
      startRecording();
    } else {
      stopRecordingAndProcess();
    }

    return () => {
      cleanup();
    };
  }, [muted]);

  return null;
};

export default MicStreamer;
