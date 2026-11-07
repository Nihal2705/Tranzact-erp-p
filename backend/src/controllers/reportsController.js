const pool = require("../config/db");

async function getSummary(req, res) {
  const one = async (sql) => (await pool.query(sql)).rows[0];
  const many = async (sql) => (await pool.query(sql)).rows;

  const [stock, low, month, pendingInv, notDisp, prodDone, perMonth, stockByItem, prodByStatus, lowItems, lateOrders] =
    await Promise.all([
      one("SELECT COALESCE(SUM(quantity * price), 0) AS v FROM items"),
      one("SELECT COUNT(*)::int AS v FROM items WHERE quantity < low_stock_limit"),
      one("SELECT COUNT(*)::int AS v FROM orders WHERE date_trunc('month', order_date) = date_trunc('month', CURRENT_DATE)"),
      one("SELECT COUNT(*)::int AS v FROM orders WHERE invoice_status = 'Pending'"),
      one("SELECT COUNT(*)::int AS v FROM orders WHERE order_type = 'SALES' AND goods_status <> 'Dispatched'"),
      one("SELECT COUNT(*)::int AS v FROM production_orders WHERE status = 'COMPLETED'"),
      many(`SELECT to_char(date_trunc('month', order_date), 'Mon YYYY') AS month, COUNT(*)::int AS count
            FROM orders
            WHERE order_date >= date_trunc('month', CURRENT_DATE) - interval '5 months'
            GROUP BY date_trunc('month', order_date)
            ORDER BY date_trunc('month', order_date)`),
      many("SELECT name, quantity * price AS value FROM items ORDER BY value DESC LIMIT 8"),
      many("SELECT status, COUNT(*)::int AS count FROM production_orders GROUP BY status"),
      many(`SELECT id, name, quantity, low_stock_limit, unit FROM items
            WHERE quantity < low_stock_limit ORDER BY name LIMIT 10`),
      many(`SELECT id, order_type, party_name, due_date, goods_status FROM orders
            WHERE due_date < CURRENT_DATE AND goods_status <> 'Dispatched'
            ORDER BY due_date LIMIT 10`),
    ]);

  res.json({
    kpis: {
      stock_value: stock.v,
      low_stock_count: low.v,
      orders_this_month: month.v,
      pending_invoices: pendingInv.v,
      orders_not_dispatched: notDisp.v,
      production_completed: prodDone.v,
    },
    orders_per_month: perMonth,
    stock_by_item: stockByItem,
    production_by_status: prodByStatus,
    low_stock_items: lowItems,
    late_orders: lateOrders,
  });
}

module.exports = { getSummary };