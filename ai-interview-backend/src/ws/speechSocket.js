const WebSocket = require("ws");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { OpenAI } = require("openai");

const tts = new TextToSpeechClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = function handleSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (clientSocket) => {
    console.log("Frontend WebSocket connected");
    const dgSocket = new WebSocket("wss://api.deepgram.com/v1/listen", {
      headers: {
        Authorization: "Token ${process.env.DEEPGRAM_API_KEY}",
      },
    });

    dgSocket.on("open", () => {
      console.log("Connected to Deepgram");
      //audio from frontend to Deepgram
      clientSocket.on("message", (audioChunk) => {
        dgSocket.send(audioChunk);
      });

      //transcription from Deepgram
      dgSocket.on("message", async (msg) => {
        const data = JSON.parse(msg);
        const transcript = data.channel?.alternatives?.[0]?.transcript;

        if (transcript && data.is_final) {
          console.log("Transcript", transcript);

          // openai api
          const gpt = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful and technical AI interviewer. Ask follow-up questions, provide hints if needed.",
              },
              { role: "user", content: transcript },
            ],
          });
          const reply = gpt.choices[0].messages.content;
          console.log("GPT:", reply);

          const [ttsResponse] = await tts.synthesizeSpeech({
            input: { text: reply },
            voice: { languageCode: "en-US", name: "en-US-Wavenet-D" },
            audioConfig: { audioEncoding: "MP3" },
          });
          clientSocket.send(ttsResponse.audioContent);
        }
      });
      clientSocket.on("close", () => {
        dgSocket.close();
        console.log("Client WS dc'd");
      });
    });
    dgSocket.on("error", (err) => {
      console.error("Deepgram error:", err);
    });
  });
};
