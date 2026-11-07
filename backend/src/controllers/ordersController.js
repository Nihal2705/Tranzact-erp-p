const { changeStock } = require("../services/stockService");
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
async function getOrderById(id) {
  const { rows } = await pool.query(
    `SELECT o.*,
       COALESCE(json_agg(json_build_object(
         'id', oi.id, 'item_id', oi.item_id, 'item_name', i.name, 'unit', i.unit,
         'quantity', oi.quantity, 'price', oi.price, 'fulfilled_qty', oi.fulfilled_qty
       ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS lines
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN items i ON i.id = oi.item_id
     WHERE o.id = $1 GROUP BY o.id`,
    [id]
  );
  return rows[0];
}

async function updateOrderStatus(req, res) {
  const id = Number(req.params.id);
  const { invoice_status, dispatch, request_id } = req.body;

  if (!invoice_status && !dispatch) return res.status(400).json({ error: "Nothing to update" });
  if (invoice_status && invoice_status !== "Created") return res.status(400).json({ error: "Invoice status can only be set to Created" });
  if (dispatch && (!Array.isArray(dispatch) || dispatch.length === 0)) return res.status(400).json({ error: "Dispatch list is empty" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const found = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [id]);
    const order = found.rows[0];
    if (!order) throw { status: 404, message: "Order not found" };

    if (invoice_status) {
      if (order.invoice_status === "Created") throw { status: 400, message: "Invoice is already created" };
      await client.query(
        "UPDATE orders SET invoice_status = 'Created', invoice_created_at = now(), updated_at = now() WHERE id = $1", [id]
      );
    }

    if (dispatch) {
      const isSales = order.order_type === "SALES";
      for (const d of dispatch) {
        const qty = Number(d.qty);
        if (!qty || qty <= 0) throw { status: 400, message: "Quantity must be more than 0" };

        const lineRes = await client.query(
          "SELECT * FROM order_items WHERE id = $1 AND order_id = $2 FOR UPDATE", [d.order_item_id, id]
        );
        const line = lineRes.rows[0];
        if (!line) throw { status: 400, message: "Order line not found" };

        const remaining = line.quantity - line.fulfilled_qty;
        if (qty > remaining) throw { status: 400, message: `Only ${remaining} left to ${isSales ? "dispatch" : "receive"}` };

        const result = await changeStock(client, {
          itemId: line.item_id,
          changeQty: isSales ? -qty : qty,
          changedVia: isSales ? "Sales Dispatch" : "Purchase Inward",
          reason: `Order #${id}`,
          userId: req.user.id,
          requestId: request_id,
          orderId: id,
        });
        if (!result.duplicate) {
          await client.query("UPDATE order_items SET fulfilled_qty = fulfilled_qty + $1 WHERE id = $2", [qty, line.id]);
        }
      }

      const sums = await client.query(
        "SELECT SUM(quantity) AS total, SUM(fulfilled_qty) AS done FROM order_items WHERE order_id = $1", [id]
      );
      const { total, done } = sums.rows[0];
      const status = done === 0 ? "Not Dispatched" : done >= total ? "Dispatched" : "Partially Dispatched";
      await client.query("UPDATE orders SET goods_status = $1, updated_at = now() WHERE id = $2", [status, id]);
    }

    await client.query("COMMIT");
    res.json(await getOrderById(id));
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

async function getTimeline(req, res) {
  const id = Number(req.params.id);
  const order = await getOrderById(id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const events = [{ event: "Order Created", date: order.created_at, details: `${order.order_type} order for ${order.party_name}` }];
  if (order.invoice_created_at) events.push({ event: "Invoice Created", date: order.invoice_created_at, details: "" });

  const { rows } = await pool.query(
    `SELECT h.created_at, h.change_qty, i.name, i.unit
     FROM stock_history h JOIN items i ON i.id = h.item_id
     WHERE h.order_id = $1 ORDER BY h.created_at`,
    [id]
  );
  for (const r of rows) {
    events.push({
      event: order.order_type === "SALES" ? "Goods Dispatched" : "Goods Received",
      date: r.created_at,
      details: `${Math.abs(r.change_qty)} ${r.unit} of ${r.name}`,
    });
  }
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(events);
}
module.exports = { getOrders, createOrder, updateOrderStatus, getTimeline };