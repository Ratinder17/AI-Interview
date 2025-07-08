const express = require("express");
const cors = require("cors");
require("dotenv").config();
const userRoutes = require("./routes/user");
const questionRoutes = require("./routes/questions");
const ttsRoutes = require("./routes/tts");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/tts", ttsRoutes);

app.get("/", (req, res) => {
  console.log("Root route hit");
  res.send("API is running");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
