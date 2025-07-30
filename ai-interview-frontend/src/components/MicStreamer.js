import React, { useImperativeHandle, useRef, forwardRef } from "react";
import Recorder from "recorder-js";
import axios from "axios";

const MicStreamer = forwardRef(({ question, solution }, ref) => {
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const previousCodeRef = useRef(solution);

  const cleanup = () => {
    if (recorderRef.current) {
      recorderRef.current.stop().catch(() => {});
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const getCodeDiff = (oldCode, newCode) => {
    const oldLines = oldCode.split("\n");
    const newLines = newCode.split("\n");
    const diffLines = [];

    newLines.forEach((line, index) => {
      if (line !== oldLines[index]) {
        diffLines.push(`Line ${index + 1}: ${line}`);
      }
    });

    return diffLines.length > 0
      ? diffLines.join("\n")
      : "[No significant code changes]";
  };

  const startRecording = async () => {
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

      console.log("Recording started");
    } catch (err) {
      console.error("Mic error:", err);
      throw err;
    }
  };

  const stopRecordingAndProcess = async () => {
    try {
      const { blob: wavBlob } = await recorderRef.current.stop();
      cleanup();
      console.log("Recording stopped. Processing audio...");

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
      console.log("Transcript:", transcript);

      if (!transcript || transcript.trim().length < 2) {
        console.warn("Empty transcript");
        return;
      }

      const codeDiff = getCodeDiff(previousCodeRef.current, solution);
      previousCodeRef.current = solution;

      const combinedTranscript = `${transcript}\n\nHere are the recent code changes:\n${codeDiff}`;

      const aiRes = await axios.post("http://localhost:4000/api/openai", {
        transcript: combinedTranscript,
        question,
      });

      const aiReply = aiRes.data.reply;
      console.log("AI Reply:", aiReply);

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
      console.error("Error in stop-and-process:", err);
    }
  };

  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecordingAndProcess,
  }));

  return null;
});

export default MicStreamer;
