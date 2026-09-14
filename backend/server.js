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

app.use(cors());
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
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
