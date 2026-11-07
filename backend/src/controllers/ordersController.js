const pool = require("../config/db");

const isNum = (v) => v !== "" && v !== null && !isNaN(Number(v));

async function getOrders(req, res) {
  const type = req.query.order_type || "";
  const search = `%${req.query.search || ""}%`;
  const { rows } = await pool.query(
    `SELECT o.*,
       COALESCE(json_agg(json_build_object(
         'id', oi.id, 'item_id', oi.item_id, 'item_name', i.name, 'unit', i.unit,
         'quantity', oi.quantity, 'price', oi.price, 'fulfilled_qty', oi.fulfilled_qty
       ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS lines
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN items i ON i.id = oi.item_id
     WHERE ($1 = '' OR o.order_type = $1) AND o.party_name ILIKE $2
     GROUP BY o.id
     ORDER BY o.id DESC`,
    [type, search]
  );
  res.json(rows);
}

async function createOrder(req, res) {
  const { order_type, party_name, order_date, due_date, lines } = req.body;

  if (!["SALES", "PURCHASE"].includes(order_type)) return res.status(400).json({ error: "Type must be SALES or PURCHASE" });
  if (!party_name || !party_name.trim()) return res.status(400).json({ error: "Customer/supplier name is required" });
  if (!Array.isArray(lines) || lines.length === 0) return res.status(400).json({ error: "Add at least one item" });
  for (const l of lines) {
    if (!l.item_id) return res.status(400).json({ error: "Every line needs an item" });
    if (!isNum(l.quantity) || Number(l.quantity) <= 0) return res.status(400).json({ error: "Quantity must be more than 0" });
    if (!isNum(l.price) || Number(l.price) < 0) return res.status(400).json({ error: "Price must be 0 or more" });
  }

  const total = lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.price), 0);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO orders (order_type, party_name, order_date, due_date, total_amount, created_by)
       VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6) RETURNING *`,
      [order_type, party_name.trim(), order_date || null, due_date || null, total, req.user.id]
    );
    for (const l of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, quantity, price) VALUES ($1, $2, $3, $4)`,
        [rows[0].id, l.item_id, l.quantity, l.price]
      );
    }
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") return res.status(400).json({ error: "Each item can appear only once in an order" });
    if (err.code === "23503") return res.status(400).json({ error: "One of the selected items does not exist" });
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getOrders, createOrder };