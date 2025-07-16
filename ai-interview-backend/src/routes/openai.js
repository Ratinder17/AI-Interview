const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { transcript, question } = req.body;

  if (!transcript || !question?.title || !question?.problemStatement) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly but sharp technical interviewer for a software engineering role. Keep your responses conversational but focused. Provide feedback on the candidate’s explanations and code approach.",
        },
        {
          role: "user",
          content: `The candidate is solving this question: "${question.title}". ${question.problemStatement}\n\nThey just said: "${transcript}"`,
        },
      ],
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
