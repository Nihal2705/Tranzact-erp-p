const pool = require("../config/db");
const { changeStock } = require("../services/stockService");

const FLOW = ["PLANNED", "PENDING", "WIP", "IN-TESTING", "COMPLETED"];

async function queryProduction(where, params) {
  const { rows } = await pool.query(
    `SELECT p.*, f.name AS finished_item_name, f.unit AS finished_item_unit,
       COALESCE((
         SELECT json_agg(json_build_object(
           'raw_item_id', r.id, 'raw_item_name', r.name, 'unit', r.unit,
           'qty_needed', b.qty_per_unit * p.target_qty, 'qty_in_stock', r.quantity
         ) ORDER BY r.name)
         FROM bom_lines b JOIN items r ON r.id = b.raw_item_id
         WHERE b.finished_item_id = p.finished_item_id
       ), '[]') AS materials
     FROM production_orders p JOIN items f ON f.id = p.finished_item_id
     ${where} ORDER BY p.id DESC`,
    params
  );
  return rows;
}

async function getProduction(req, res) {
  res.json(await queryProduction(
    `WHERE ($1 = '' OR p.status = $1)
       AND ($2 = '' OR p.created_at::date >= $2::date)
       AND ($3 = '' OR p.created_at::date <= $3::date)`,
    [req.query.status || "", req.query.from || "", req.query.to || ""]
  ));
}

async function getProductionOne(req, res) {
  const rows = await queryProduction("WHERE p.id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Production order not found" });
  res.json(rows[0]);
}

async function createProduction(req, res) {
  const { finished_item_id, target_qty, planned_date } = req.body;
  if (!finished_item_id) return res.status(400).json({ error: "Select a finished item" });
  if (isNaN(Number(target_qty)) || Number(target_qty) <= 0) return res.status(400).json({ error: "Target quantity must be more than 0" });

  const item = await pool.query("SELECT item_type FROM items WHERE id = $1", [finished_item_id]);
  if (!item.rows[0]) return res.status(400).json({ error: "Item not found" });
  if (item.rows[0].item_type !== "FINISHED") return res.status(400).json({ error: "Only finished goods can be produced" });

  const bom = await pool.query("SELECT COUNT(*)::int AS n FROM bom_lines WHERE finished_item_id = $1", [finished_item_id]);
  if (bom.rows[0].n === 0) return res.status(400).json({ error: "This item has no recipe (BOM) yet" });

  const { rows } = await pool.query(
    `INSERT INTO production_orders (finished_item_id, target_qty, planned_date, created_by)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [finished_item_id, target_qty, planned_date || null, req.user.id]
  );
  const created = await queryProduction("WHERE p.id = $1", [rows[0].id]);
  res.status(201).json(created[0]);
}

async function updateProductionStatus(req, res) {
  const id = Number(req.params.id);
  const { status, completed_qty } = req.body;
  if (!status && completed_qty === undefined) return res.status(400).json({ error: "Nothing to update" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const found = await client.query("SELECT * FROM production_orders WHERE id = $1 FOR UPDATE", [id]);
    const order = found.rows[0];
    if (!order) throw { status: 404, message: "Production order not found" };
    if (order.status === "COMPLETED") throw { status: 409, message: "This production order is already completed" };

    let newStatus = order.status;
    if (status) {
      const next = FLOW[FLOW.indexOf(order.status) + 1];
      if (status !== next) throw { status: 400, message: `The next status must be ${next}` };
      newStatus = status;
    }

    let newCompleted = order.completed_qty;
    if (completed_qty !== undefined) {
      if (!["WIP", "IN-TESTING"].includes(newStatus)) throw { status: 400, message: "Progress can only be updated during WIP or IN-TESTING" };
      const cq = Number(completed_qty);
      if (isNaN(cq) || cq < 0 || cq > order.target_qty) throw { status: 400, message: `Completed quantity must be between 0 and ${order.target_qty}` };
      newCompleted = cq;
    }

    if (newStatus === "COMPLETED") {
      const bom = await client.query(
        `SELECT b.raw_item_id, b.qty_per_unit, r.price
         FROM bom_lines b JOIN items r ON r.id = b.raw_item_id
         WHERE b.finished_item_id = $1`,
        [order.finished_item_id]
      );

      let totalCost = 0;
      for (const b of bom.rows) {
        const needed = Math.round(b.qty_per_unit * order.target_qty * 1000) / 1000;
        await changeStock(client, {
          itemId: b.raw_item_id, changeQty: -needed, changedVia: "Production Consumption",
          reason: `Production order #${id}`, userId: req.user.id, productionOrderId: id,
        });
        totalCost += needed * b.price; // cost uses the raw material price at this moment
      }

      await changeStock(client, {
        itemId: order.finished_item_id, changeQty: order.target_qty, changedVia: "Production Output",
        reason: `Production order #${id}`, userId: req.user.id, productionOrderId: id,
      });

      await client.query(
        `UPDATE production_orders
         SET status = 'COMPLETED', completed_qty = target_qty, total_cost = $1, completed_at = now(), updated_at = now()
         WHERE id = $2`,
        [Math.round(totalCost * 100) / 100, id]
      );
    } else {
      await client.query(
        "UPDATE production_orders SET status = $1, completed_qty = $2, updated_at = now() WHERE id = $3",
        [newStatus, newCompleted, id]
      );
    }

    await client.query("COMMIT");
    const updated = await queryProduction("WHERE p.id = $1", [id]);
    res.json(updated[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getProduction, getProductionOne, createProduction, updateProductionStatus };