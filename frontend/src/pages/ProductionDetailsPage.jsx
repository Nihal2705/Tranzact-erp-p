import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";

const FLOW = ["PLANNED", "PENDING", "WIP", "IN-TESTING", "COMPLETED"];
const money = (n) => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function ProductionDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [progress, setProgress] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/production/${id}`)
      .then((r) => setOrder(r.data))
      .catch((err) => setError(err.response?.data?.error || "Could not load production order."));
  }, [id]);

  if (!order) return <p className="text-slate-500">{error || "Loading..."}</p>;

  const idx = FLOW.indexOf(order.status);
  const next = FLOW[idx + 1];
  const done = order.status === "COMPLETED";
  const canTrackProgress = order.status === "WIP" || order.status === "IN-TESTING";
  const pct = Math.round((order.completed_qty / order.target_qty) * 100);

  async function update(body, message) {
    setSaving(true);
    setError("");
    try {
      const { data } = await api.put(`/production/${id}/status`, body);
      setOrder(data);
      setProgress("");
      setToast(message);
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Cannot reach the server");
    } finally {
      setConfirm(false);
      setSaving(false);
    }
  }

  function updateProgress() {
    const q = Number(progress);
    if (progress === "" || isNaN(q) || q < 0 || q > order.target_qty) {
      return setError(`Enter a number between 0 and ${order.target_qty}`);
    }
    update({ completed_qty: q }, "Progress updated");
  }

  return (
    <div className="space-y-4">
      <Link to="/production" className="text-sm text-teal-700 hover:underline">← Back to production</Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Production order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-slate-600">
        {order.finished_item_name} · Target <b>{order.target_qty} {order.finished_item_unit}</b> · Planned {order.planned_date || "-"}
      </p>

      {toast && <div className="bg-green-50 text-green-700 p-3 rounded">{toast}</div>}
      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      {/* Stages */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex">
          {FLOW.map((s, i) => (
            <div key={s} className="flex-1 text-center">
              <div className={`h-2 ${i <= idx ? "bg-teal-600" : "bg-slate-200"} ${i === 0 ? "rounded-l-full" : ""} ${i === FLOW.length - 1 ? "rounded-r-full" : ""}`} />
              <p className={`text-xs mt-2 ${i === idx ? "font-bold text-teal-700" : "text-slate-500"}`}>{s}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-sm text-slate-600 mb-1">Progress: {order.completed_qty} of {order.target_qty} ({pct}%)</p>
          <div className="bg-slate-200 rounded-full h-3">
            <div className="bg-teal-600 h-3 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {canTrackProgress && (
          <div className="flex gap-2 mt-4">
            <input value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="Completed quantity"
              className="border rounded-lg px-3 py-2 w-48" />
            <button onClick={updateProgress} disabled={saving} className="px-4 py-2 border border-teal-600 text-teal-700 rounded-lg">
              Update progress
            </button>
          </div>
        )}
      </div>

      {/* Raw materials */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <h2 className="font-bold text-slate-800 px-4 pt-4">Raw materials</h2>
        <table className="w-full text-sm mt-2">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-3">Material</th><th className="px-4 py-3">{done ? "Used" : "Needed"}</th>
              <th className="px-4 py-3">In stock now</th>
            </tr>
          </thead>
          <tbody>
            {order.materials.map((m) => {
              const short = !done && m.qty_in_stock < m.qty_needed;
              return (
                <tr key={m.raw_item_id} className="border-t">
                  <td className="px-4 py-3">{m.raw_item_name}</td>
                  <td className="px-4 py-3">{m.qty_needed} {m.unit}</td>
                  <td className={`px-4 py-3 ${short ? "text-red-600 font-medium" : ""}`}>
                    {m.qty_in_stock} {m.unit} {short && "⚠️ Not enough"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {done && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="font-medium text-green-800">
            ✔ Finished goods produced: {order.target_qty} {order.finished_item_unit} of {order.finished_item_name}
          </p>
          <p className="text-green-800">Total cost: <b>{money(order.total_cost)}</b></p>
        </div>
      )}

      {next && (
        <button
          onClick={() => (next === "COMPLETED" ? setConfirm(true) : update({ status: next }, `Moved to ${next}`))}
          disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-60">
          Move to {next}
        </button>
      )}

      {confirm && (
        <Modal title="Complete production order?" onClose={() => setConfirm(false)}>
          <p>
            <b>{order.target_qty} {order.finished_item_unit}</b> of {order.finished_item_name} will be added to stock,
            and the raw materials listed above will be used up. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setConfirm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button onClick={() => update({ status: "COMPLETED" }, "Production completed")} disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-60">
              {saving ? "Saving..." : "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}