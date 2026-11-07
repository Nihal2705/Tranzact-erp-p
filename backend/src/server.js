require("dotenv").config();
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error("Missing DATABASE_URL or JWT_SECRET in .env");
  process.exit(1);
}
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : true }));
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Database not connected" });
  }
});
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/items", require("./routes/itemsRoutes"));
app.use("/api/orders", require("./routes/ordersRoutes"));
app.use("/api/production", require("./routes/productionRoutes"));
app.use("/api/reports", require("./routes/reportsRoutes"));
app.use("/api", (req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON in request" });
  if (err.code === "22P02") return res.status(400).json({ error: "Invalid id or value" });
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));