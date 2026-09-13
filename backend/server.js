require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const extractRoutes = require("./routes/extract");
const taskRoutes = require("./routes/tasks");
const decisionRoutes = require("./routes/decisions");
const searchRoutes = require("./routes/search");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" })); // allow reasonably long transcripts

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Feature routes
app.use("/api", extractRoutes);
app.use("/api", taskRoutes);
app.use("/api", decisionRoutes);
app.use("/api", searchRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
