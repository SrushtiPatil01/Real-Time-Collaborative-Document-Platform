import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import workspaceRoutes from "./routes/workspace.routes";
import documentRoutes from "./routes/document.routes";
import fileRoutes from "./routes/file.routes";
import versionRoutes from "./routes/version.routes";

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));

// Rate limiting
app.use(
  "/api/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, message: "Too many requests" } })
);
app.use(
  "/api",
  rateLimit({ windowMs: 60 * 1000, max: 100, message: { success: false, message: "Rate limit exceeded" } })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/versions", versionRoutes);

// Error handler
app.use(errorHandler);

export default app;