async function changeStock(client, { itemId, changeQty, changedVia, reason, userId, requestId }) {
  // If this exact request was already applied, don't apply it again
  if (requestId) {
    const dup = await client.query(
      "SELECT id FROM stock_history WHERE request_id = $1 AND item_id = $2",
      [requestId, itemId]
    );
    if (dup.rows[0]) return { duplicate: true };
  }

  // Lock the item row so two changes can't clash
  const { rows } = await client.query("SELECT * FROM items WHERE id = $1 FOR UPDATE", [itemId]);
  const item = rows[0];
  if (!item) throw { status: 404, message: "Item not found" };

  const newQty = item.quantity + changeQty;
  if (newQty < 0) throw { status: 400, message: `Not enough ${item.name} in stock (available: ${item.quantity})` };

  await client.query("UPDATE items SET quantity = $1, updated_at = now() WHERE id = $2", [newQty, itemId]);
  const hist = await client.query(
    `INSERT INTO stock_history (item_id, change_qty, balance_after, changed_via, reason, changed_by, request_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [itemId, changeQty, newQty, changedVia, reason, userId, requestId || null]
  );
  return { item: { ...item, quantity: newQty }, history_entry: hist.rows[0] };
}

module.exports = { changeStock };