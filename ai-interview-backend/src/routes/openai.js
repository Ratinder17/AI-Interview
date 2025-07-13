const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const reply = completion.choices[0]?.message?.content;
    res.json({ reply });
  } catch (error) {
    console.error("OpenAI Error:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });
    res.status(500).send("Failed to generate response from AI");
  }
});

module.exports = router;
