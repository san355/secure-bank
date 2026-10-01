import "dotenv/config";

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import routes from "./routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173" || "http://localhost:5174" || "http://localhost:5175",
  })
);

app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: {
      message: "Too many requests"
    }
  })
);

app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    service: "SecureBank API"
  });
});

app.use("/api", routes);
app.get("/", (req, res) => {
  res.send("Secure Bank API is running");
});

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    console.log("MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

start();