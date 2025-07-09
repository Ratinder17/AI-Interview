const express = require("express");
const cors = require("cors");
require("dotenv").config();
const userRoutes = require("./routes/user");
const questionRoutes = require("./routes/questions");
const ttsRoutes = require("./routes/tts");
const http = require("http");
const handleSocket = require("./ws/speechSocket");

const app = express();
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

handleSocket(server);

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/tts", ttsRoutes);

app.get("/", (req, res) => {
  console.log("Root route hit");
  res.send("API is running");
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
