require("dotenv").config();
const pool = require("./src/config/db");

(async () => {
  await pool.query("DELETE FROM stock_history WHERE item_id IN (6, 10)");
  const r = await pool.query("DELETE FROM items WHERE id IN (6, 10) RETURNING id, name");
  console.log("Deleted:", r.rows);
  process.exit();
})();