import { useRef, useState } from "react";
import Modal from "./Modal";
import api from "../services/api";

export default function ChangeStockModal({ item, onClose, onSaved }) {
  const [change, setChange] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const requestId = useRef(crypto.randomUUID()); // same id if the user retries = no double change

  const qty = Number(change);
  const newQty = item.quantity + qty;

  function review(e) {
    e.preventDefault();
    if (change === "" || isNaN(qty) || qty === 0) return setError("Enter a number like 50 or -10");
    if (!reason.trim()) return setError("Reason is required");
    if (newQty < 0) return setError(`Stock cannot go below zero (available: ${item.quantity})`);
    setError("");
    setConfirming(true);
  }

  async function confirm() {
    setSaving(true);
    setError("");
    try {
      await api.put(`/items/${item.id}/stock`, { change_qty: qty, reason, request_id: requestId.current });
      onSaved("Stock updated");
    } catch (err) {
      setConfirming(false);
      setError(err.response?.data?.error || "Cannot reach the server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Change stock: ${item.name}`} onClose={onClose}>
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-3">{error}</div>}

      {!confirming ? (
        <form onSubmit={review} className="space-y-3">
          <p className="text-sm text-slate-500">Current stock: <b>{item.quantity} {item.unit}</b></p>
          <input value={change} onChange={(e) => setChange(e.target.value)}
            placeholder="Change (e.g. 50 or -10)" className="w-full border rounded-lg px-3 py-2" />
          <input value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (e.g. Damaged, Stock count)" className="w-full border rounded-lg px-3 py-2" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg">Continue</button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p>
            Change <b>{item.name}</b> by <b>{qty > 0 ? "+" : ""}{qty} {item.unit}</b>?<br />
            New stock will be <b>{newQty} {item.unit}</b>.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirming(false)} className="px-4 py-2 border rounded-lg">Back</button>
            <button onClick={confirm} disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-60">
              {saving ? "Saving..." : "Confirm"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}