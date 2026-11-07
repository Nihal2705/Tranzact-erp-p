import { useState } from "react";
import Modal from "./Modal";
import api from "../services/api";

const isNum = (v) => v !== "" && !isNaN(Number(v));

function Field({ label, error, children }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600">{label}</span>
      {children}
      {error && <span className="text-red-600 text-xs">{error}</span>}
    </label>
  );
}

const inputCls = "w-full border rounded-lg px-3 py-2 mt-1";

export default function ItemFormModal({ item, onClose, onSaved }) {
  const editing = !!item;
  const [form, setForm] = useState({
    name: item?.name || "",
    item_type: item?.item_type || "RAW",
    unit: item?.unit || "",
    price: item?.price ?? "",
    low_stock_limit: item?.low_stock_limit ?? 0,
    opening_qty: 0,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Item name is required";
    if (!form.unit.trim()) e.unit = "Unit is required";
    if (!isNum(form.price) || Number(form.price) < 0) e.price = "Enter a valid price (0 or more)";
    if (!isNum(form.low_stock_limit) || Number(form.low_stock_limit) < 0) e.low_stock_limit = "Enter 0 or more";
    if (!editing && (!isNum(form.opening_qty) || Number(form.opening_qty) < 0)) e.opening_qty = "Enter 0 or more";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setApiError("");
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) await api.put(`/items/${item.id}`, form);
      else await api.post("/items", form);
      onSaved(editing ? "Item updated" : "Item added");
    } catch (err) {
      setApiError(err.response?.data?.error || "Cannot reach the server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={editing ? "Edit item" : "Add item"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {apiError && <div className="bg-red-50 text-red-700 text-sm p-3 rounded">{apiError}</div>}
        <Field label="Item name" error={errors.name}>
          <input className={inputCls} value={form.name} onChange={set("name")} />
        </Field>
        {!editing && (
          <Field label="Type">
            <select className={inputCls} value={form.item_type} onChange={set("item_type")}>
              <option value="RAW">RAW (raw material)</option>
              <option value="FINISHED">FINISHED (finished good)</option>
            </select>
          </Field>
        )}
        <Field label="Unit (kg, pcs, ...)" error={errors.unit}>
          <input className={inputCls} value={form.unit} onChange={set("unit")} />
        </Field>
        <Field label="Price per unit (₹)" error={errors.price}>
          <input className={inputCls} value={form.price} onChange={set("price")} />
        </Field>
        <Field label="Low-stock limit" error={errors.low_stock_limit}>
          <input className={inputCls} value={form.low_stock_limit} onChange={set("low_stock_limit")} />
        </Field>
        {!editing && (
          <Field label="Opening quantity" error={errors.opening_qty}>
            <input className={inputCls} value={form.opening_qty} onChange={set("opening_qty")} />
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-60">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}