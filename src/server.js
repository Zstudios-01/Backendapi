import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import apikeyRoutes from "./routes/apikey.js";
import logsRoutes from "./routes/logs.js";
import statsRoutes from "./routes/stats.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/auth", authRoutes);
app.use("/apikey", apikeyRoutes);
app.use("/logs", logsRoutes);
app.use("/stats", statsRoutes);

app.get("/", (req, res) => {
  res.json({ message: "✅ Backend API is running!" });
});

// For Vercel (export handler)
export default app;
