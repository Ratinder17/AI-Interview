import React, { useEffect, useRef } from "react";
import Recorder from "recorder-js";
import axios from "axios";

const MicStreamer = () => {
  const socketRef = useRef(null);
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    const deepgramSocket = new WebSocket(
      "wss://api.deepgram.com/v1/listen?language=en&access_token=${process.env.REACT_APP_DEEPGRAM_API_KEY}"
    );

    deepgramSocket.onopen = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      const recorder = new Recorder(audioContextRef.current, {
        numChannels: 1,
      });
      recorder.init(stream);
      recorder.start();

      recorderRef.current = recorder;

      const interval = setInterval(async () => {
        const { buffer } = await recorderRef.current.getBuffer();
        const wav = await recorderRef.current.exportWAV();
        if (deepgramSocket.readyState === 1) {
          deepgramSocket.send(wav);
        }
      }, 500);

      socketRef.current = deepgramSocket;
      return () => {
        clearInterval(interval);
        recorder.stop();
        stream.getTracks().forEach((track) => track.stop());
        deepgramSocket.close();
      };
    };
    deepgramSocket.onmessage = async (message) => {
      const data = JSON.parse(message.data);
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      if (transcript) {
        console.log("User said:", transcript);
        // TODO: send transcript to OpenAI for response
        /*const response = await fetch("http://localhost:4000/api/openai", {
          method : "POST",
          headers:{
            "Content-Type": "application/json",
          },
          body: JSON.stringify({prompt: transcript}),
        });*/
        try {
          const res = await axios.post("http://localhost:4000/api/openai", {
            prompt: transcript,
          });
          const aiReply = res.data.reply;
          console.log("AI replied", aiReply);

          const ttsRes = await fetch("http://localhost:4000/api/tts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: aiReply }),
          });
          const audio = await ttsRes.blob();
          const audioURL = URL.createObjectURL(audio);
          const finalAudio = new Audio(audioURL);
          finalAudio.play();
        } catch (err) {
          console.error("Error handling AI pipeline:", err);
        }
      }
    };
    deepgramSocket.onerror = (error) => {
      console.error("Websocket error: ", error);
    };
    deepgramSocket.onclose = () => {
      console.log("Websocket closed");
    };
  }, []);
  return <p style={{ color: "green" }}>🎙️ Listening for your response...</p>;
};

export default MicStreamer;
