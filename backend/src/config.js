require("dotenv").config();

const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rag_chatbot",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
};

module.exports = config;
