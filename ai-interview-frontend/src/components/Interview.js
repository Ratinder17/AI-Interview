import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "../App.css";
import MicStreamer from "./MicStreamer";

const Interview = () => {
  const [question, setQuestion] = useState(null);
  const [solution, setSolution] = useState("");
  const [error, setError] = useState("");
  const [startMic, setStartMic] = useState(false);
  const [muted, setMuted] = useState(true);

  const micRef = useRef(null);

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/questions/random")
      .then((res) => setQuestion(res.data))
      .catch(() => setError("Failed to load question"));
  }, []);

  const handleStart = async () => {
    if (!question) return;

    const introScript = `Hi there! Welcome to your mock technical interview. 
    Today's question is titled "${question.title}". 
    ${question.problemStatement}. 
    Please take a few seconds to understand the question, and then walk me through your approach as you code. Good luck!`;

    try {
      const response = await fetch("http://localhost:4000/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: introScript }),
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => {
        setStartMic(true);
      };
    } catch (err) {
      console.error("TTS failed:", err);
    }
  };

  const toggleMute = async () => {
    if (muted) {
      try {
        await micRef.current?.startRecording();
        setMuted(false);
      } catch (err) {
        console.error("Microphone permission denied or failed to start", err);
      }
    } else {
      micRef.current?.stopRecordingAndProcess();
      setMuted(true);
    }
  };

  if (error) {
    return <div className="interview-loading">{error}</div>;
  }

  if (!question) {
    return <div className="interview-loading">Loading...</div>;
  }

  return (
    <div className="interview-container">
      {/* Left: Question + Answer Area */}
      <div className="interview-left">
        <div className="start-button">
          <button onClick={handleStart}>Start Interview</button>
        </div>
        <div className="interview-portion">
          <h2>{question.title}</h2>
          <p className="question-text">{question.problemStatement}</p>
          <textarea
            className="code-area"
            placeholder="// Type your solution here..."
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
          />
        </div>
      </div>

      {/* Right: AI Interviewer */}
      <div className="interview-right">
        <h3>AI Interviewer</h3>
        <video
          src="/ai-interviewer.mp4"
          controls
          autoPlay
          loop
          className="ai-video"
        />
        <button onClick={toggleMute} className="mic-toggle-btn">
          {muted ? "🔇 Unmute" : "🎙️ Mute"}
        </button>
        {/* Render MicStreamer only after TTS intro finishes */}
        {startMic && <MicStreamer ref={micRef} question={question} />}
      </div>
    </div>
  );
};

export default Interview;
