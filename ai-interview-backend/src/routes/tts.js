const express = require("express");
const textToSpeech = require("@google-cloud/text-to-speech");

const router = express.Router();
const client = new textToSpeech.TextToSpeechClient();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;
    const request = {
      input: { text },
      voice: { languageCode: "en-US", name: "en-US-Wavenet-D" },
      audioConfig: { audioEncoding: "MP3" },
    };

    const [response] = await client.synthesizeSpeech(request);

    const audioBuffer = Buffer.from(response.audioContent, "base64");

    res.set("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (error) {
    console.error("TTS error:", error);
    res.status(500).send("Failed to generate audio");
  }
});

module.exports = router;
