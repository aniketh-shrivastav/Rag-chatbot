const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const { port, mongoUri, corsOrigin } = require("./config");

const app = express();

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: "Unexpected server error" });
});

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Auth API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
