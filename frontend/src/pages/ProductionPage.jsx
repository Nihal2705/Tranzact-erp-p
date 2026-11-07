import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import ProductionFormModal from "../components/ProductionFormModal";

const STATUSES = ["PLANNED", "PENDING", "WIP", "IN-TESTING", "COMPLETED"];

export default function ProductionPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canCreate = user.role === "Admin" || user.role === "Manager";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/production", { params: { status } });
      setOrders(data);
    } catch {
      setError("Could not load production orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  function saved(message) {
    setShowForm(false);
    setToast(message);
    load();
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Production</h1>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg">
            + Create production order
          </button>
        )}
      </div>

      {toast && <div className="bg-green-50 text-green-700 p-3 rounded">{toast}</div>}

      <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 bg-white">
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {loading && <p className="text-slate-500">Loading production orders...</p>}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded flex justify-between">
          {error} <button onClick={load} className="underline">Retry</button>
        </div>
      )}
      {!loading && !error && orders.length === 0 && <p className="text-slate-500">No production orders yet.</p>}

      {!loading && !error && orders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                {["Order", "Finished good", "Target", "Completed", "Progress", "Status", "Planned date"].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const pct = Math.round((o.completed_qty / o.target_qty) * 100);
                return (
                  <tr key={o.id} onClick={() => navigate(`/production/${o.id}`)} className="border-t hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-3 font-medium">#{o.id}</td>
                    <td className="px-4 py-3">{o.finished_item_name}</td>
                    <td className="px-4 py-3">{o.target_qty} {o.finished_item_unit}</td>
                    <td className="px-4 py-3">{o.completed_qty}</td>
                    <td className="px-4 py-3 w-40">
                      <div className="bg-slate-200 rounded-full h-2">
                        <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{pct}%</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">{o.planned_date || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <ProductionFormModal onClose={() => setShowForm(false)} onSaved={saved} />}
    </div>
  );
}