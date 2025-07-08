import React, { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

const Interview = () => {
  const [question, setQuestion] = useState(null);
  const [solution, setSolution] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/questions/random")
      .then((res) => setQuestion(res.data))
      .catch(() => setError("Failed to load question"));
  }, []);

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
          <button>Start Interview</button>
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
      </div>
    </div>
  );
};

export default Interview;
