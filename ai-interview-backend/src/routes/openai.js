const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { transcript, question, inputType } = req.body;

  if (!transcript || !question?.title || !question?.problemStatement) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const prompt =
      inputType === "code"
        ? `Here is the current code the candidate has written for the question "${question.title}". Please analyze the code and comment constructively without suggesting approaches unless they've already been written:\n\n${transcript}`
        : `Question: "${question.title}"\n\nUser said: "${transcript}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly but sharp technical interviewer for a software engineering role. Only comment on what the candidate has said or written. Do not suggest new approaches unless they mention one. Be supportive but critical.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content;
    res.json({ reply });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).send("Failed to generate response from AI");
  }
});

module.exports = router;
