const { changeStock } = require("../services/stockService");
const pool = require("../config/db");

const isNum = (v) => v !== "" && v !== null && !isNaN(Number(v));

function validateItem(b, isNew) {
  if (!b.name || !b.name.trim()) return "Item name is required";
  if (isNew && !["RAW", "FINISHED"].includes(b.item_type)) return "Type must be RAW or FINISHED";
  if (!b.unit || !b.unit.trim()) return "Unit is required";
  if (!isNum(b.price) || Number(b.price) < 0) return "Price must be a number, 0 or more";
  if (!isNum(b.low_stock_limit ?? 0) || Number(b.low_stock_limit ?? 0) < 0) return "Low-stock limit must be 0 or more";
  if (isNew && (!isNum(b.opening_qty ?? 0) || Number(b.opening_qty ?? 0) < 0)) return "Opening quantity must be 0 or more";
  return null;
}

async function getItems(req, res) {
  const search = `%${req.query.search || ""}%`;
  const { rows } = await pool.query(
    `SELECT *, quantity < low_stock_limit AS is_low_stock
     FROM items WHERE name ILIKE $1 ORDER BY name`,
    [search]
  );
  res.json(rows);
}

async function getLowStock(req, res) {
  const { rows } = await pool.query(
    `SELECT * FROM items WHERE quantity < low_stock_limit ORDER BY name`
  );
  res.json(rows);
}

async function createItem(req, res) {
  const b = req.body;
  const error = validateItem(b, true);
  if (error) return res.status(400).json({ error });

  const openingQty = Number(b.opening_qty || 0);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO items (name, item_type, unit, quantity, price, low_stock_limit)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [b.name.trim(), b.item_type, b.unit.trim(), openingQty, b.price, b.low_stock_limit || 0]
    );
    if (openingQty > 0) {
      await client.query(
        `INSERT INTO stock_history (item_id, change_qty, balance_after, changed_via, reason, changed_by)
         VALUES ($1, $2, $2, 'Opening Stock', 'Opening stock', $3)`,
        [rows[0].id, openingQty, req.user.id]
      );
    }
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") return res.status(409).json({ error: "An item with this name already exists" });
    throw err;
  } finally {
    client.release();
  }
}

async function updateItem(req, res) {
  const b = req.body;
  const error = validateItem(b, false);
  if (error) return res.status(400).json({ error });
  try {
    const { rows } = await pool.query(
      `UPDATE items SET name=$1, unit=$2, price=$3, low_stock_limit=$4, updated_at=now()
       WHERE id=$5 RETURNING *`,
      [b.name.trim(), b.unit.trim(), b.price, b.low_stock_limit || 0, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Item not found" });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "An item with this name already exists" });
    throw err;
  }
}
async function changeItemStock(req, res) {
  const { change_qty, reason, request_id } = req.body;
  if (!isNum(change_qty) || Number(change_qty) === 0) return res.status(400).json({ error: "Change quantity must be a non-zero number" });
  if (!reason || !reason.trim()) return res.status(400).json({ error: "Reason is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await changeStock(client, {
      itemId: Number(req.params.id), changeQty: Number(change_qty),
      changedVia: "Manual Adjustment", reason: reason.trim(), userId: req.user.id, requestId: request_id,
    });
    await client.query("COMMIT");
    if (result.duplicate) {
      const { rows } = await pool.query("SELECT * FROM items WHERE id = $1", [req.params.id]);
      return res.json({ item: rows[0], duplicate: true });
    }
    res.json(result);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

async function getHistory(req, res) {
  const { rows } = await pool.query(
    `SELECT h.*, u.name AS changed_by_name
     FROM stock_history h JOIN users u ON u.id = h.changed_by
     WHERE h.item_id = $1 ORDER BY h.created_at DESC`,
    [req.params.id]
  );
  res.json(rows);
}
module.exports = { getItems, getLowStock, createItem, updateItem, changeItemStock, getHistory };