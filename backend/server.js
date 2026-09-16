require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const extractRoutes = require("./routes/extract");
const extractFileRoutes = require("./routes/extractFile");
const taskRoutes = require("./routes/tasks");
const decisionRoutes = require("./routes/decisions");
const searchRoutes = require("./routes/search");
const projectRoutes = require("./routes/projects");

const app = express();

// Accept the local Vite app plus the deployed frontend URL(s). Set
// FRONTEND_URL to a comma-separated list when you need more than one origin.
const allowedOrigins = new Set(
  ["http://localhost:5173", ...(process.env.FRONTEND_URL || "").split(",")]
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (health checks, curl, server-to-server)
      // do not need CORS validation.
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }

      return callback(null, false);
    },
  })
);
app.use(express.json({ limit: "10mb" })); // allow large transcripts / extracted file text

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Feature routes
app.use("/api", extractRoutes);
app.use("/api", extractFileRoutes);
app.use("/api", taskRoutes);
app.use("/api", decisionRoutes);
app.use("/api", searchRoutes);
app.use("/api", projectRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
