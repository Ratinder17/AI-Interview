const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

router.get("/random", async (req, res) => {
  try {
    const questions = await prisma.questions.findMany();
    const randomIndex = Math.floor(Math.random() * questions.length);
    const question = questions[randomIndex];
    res.json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
