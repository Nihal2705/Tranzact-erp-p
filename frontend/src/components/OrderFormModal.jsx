import { useEffect, useState } from "react";
import Modal from "./Modal";
import api from "../services/api";

const inputCls = "w-full border rounded-lg px-3 py-2";

export default function OrderFormModal({ onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ order_type: "SALES", party_name: "", due_date: "" });
  const [lines, setLines] = useState([{ item_id: "", quantity: "", price: "" }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/items").then((r) => setItems(r.data)).catch(() => setError("Could not load items"));
  }, []);

  const setLine = (idx, patch) => setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  function pickItem(idx, id) {
    const item = items.find((i) => i.id === Number(id));
    setLine(idx, { item_id: id, price: item ? item.price : "" });
  }

  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.price) || 0), 0);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.party_name.trim()) return setError("Customer/supplier name is required");
    if (lines.some((l) => !l.item_id)) return setError("Select an item for every line");
    const ids = lines.map((l) => l.item_id);
    if (new Set(ids).size !== ids.length) return setError("Each item can appear only once");
    if (lines.some((l) => !(Number(l.quantity) > 0))) return setError("Quantity must be more than 0");
    if (lines.some((l) => l.price === "" || isNaN(Number(l.price)) || Number(l.price) < 0)) return setError("Price must be 0 or more");

    setSaving(true);
    try {
      await api.post("/orders", { ...form, due_date: form.due_date || null, lines });
      onSaved("Order created");
    } catch (err) {
      setError(err.response?.data?.error || "Cannot reach the server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create order" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select className={inputCls} value={form.order_type} onChange={(e) => setForm({ ...form, order_type: e.target.value })}>
            <option value="SALES">Sales order</option>
            <option value="PURCHASE">Purchase order</option>
          </select>
          <input className={inputCls} placeholder={form.order_type === "SALES" ? "Customer name" : "Supplier name"}
            value={form.party_name} onChange={(e) => setForm({ ...form, party_name: e.target.value })} />
          <input type="date" className={inputCls} value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </div>

        <div className="space-y-2">
          {lines.map((l, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <select className={`${inputCls} col-span-6`} value={l.item_id} onChange={(e) => pickItem(idx, e.target.value)}>
                <option value="">Select item...</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name} (stock {i.quantity} {i.unit})</option>)}
              </select>
              <input className={`${inputCls} col-span-2`} placeholder="Qty" value={l.quantity}
                onChange={(e) => setLine(idx, { quantity: e.target.value })} />
              <input className={`${inputCls} col-span-3`} placeholder="Price" value={l.price}
                onChange={(e) => setLine(idx, { price: e.target.value })} />
              <button type="button" disabled={lines.length === 1}
                onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                className="col-span-1 text-red-600 disabled:opacity-30">✕</button>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setLines([...lines, { item_id: "", quantity: "", price: "" }])}
          className="text-teal-700 text-sm hover:underline">+ Add line</button>

        <div className="flex justify-between items-center pt-2">
          <p className="font-semibold">Total: ₹{total.toLocaleString("en-IN")}</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-60">
              {saving ? "Saving..." : "Create order"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}