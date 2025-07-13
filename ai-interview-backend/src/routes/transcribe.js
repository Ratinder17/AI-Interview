const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { createClient } = require("@deepgram/sdk");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

router.post("", upload.single("audio"), async (req, res) => {
  try {
    const audioBuffer = req.file.buffer;

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        mimetype: "audio/wav",
        options: {
          punctuate: true,
          language: "en",
        },
      }
    );

    if (error) {
      throw new Error(error.message || "Deepgram transcription error");
    }

    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    res.json({ transcript });
  } catch (err) {
    console.error("Deepgram error:", err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

module.exports = router;
