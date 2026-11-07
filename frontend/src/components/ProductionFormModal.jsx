import { useEffect, useState } from "react";
import Modal from "./Modal";
import api from "../services/api";

const inputCls = "w-full border rounded-lg px-3 py-2";

export default function ProductionFormModal({ onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ finished_item_id: "", target_qty: "", planned_date: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/items")
      .then((r) => setItems(r.data.filter((i) => i.item_type === "FINISHED")))
      .catch(() => setError("Could not load items"));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.finished_item_id) return setError("Select a finished item");
    if (!(Number(form.target_qty) > 0)) return setError("Target quantity must be more than 0");

    setSaving(true);
    try {
      await api.post("/production", { ...form, planned_date: form.planned_date || null });
      onSaved("Production order created");
    } catch (err) {
      setError(err.response?.data?.error || "Cannot reach the server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create production order" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded">{error}</div>}

        <select className={inputCls} value={form.finished_item_id}
          onChange={(e) => setForm({ ...form, finished_item_id: e.target.value })}>
          <option value="">Select finished item...</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>

        <input className={inputCls} placeholder="Target quantity" value={form.target_qty}
          onChange={(e) => setForm({ ...form, target_qty: e.target.value })} />

        <label className="block text-sm text-slate-600">
          Planned date
          <input type="date" className={`${inputCls} mt-1`} value={form.planned_date}
            onChange={(e) => setForm({ ...form, planned_date: e.target.value })} />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-60">
            {saving ? "Saving..." : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}