import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import OrderFormModal from "../components/OrderFormModal";

const money = (n) => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const TABS = [["", "All"], ["SALES", "Sales"], ["PURCHASE", "Purchase"]];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/orders", { params: { order_type: type, search } });
      setOrders(data);
    } catch {
      setError("Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [type, search]);

  function saved(message) {
    setShowForm(false);
    setToast(message);
    load();
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
        <button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg">
          + Create order
        </button>
      </div>

      {toast && <div className="bg-green-50 text-green-700 p-3 rounded">{toast}</div>}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-white rounded-lg border overflow-hidden">
          {TABS.map(([value, label]) => (
            <button key={label} onClick={() => setType(value)}
              className={`px-4 py-2 text-sm ${type === value ? "bg-teal-600 text-white" : "hover:bg-slate-50"}`}>
              {label}
            </button>
          ))}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer/supplier..."
          className="border rounded-lg px-3 py-2 bg-white w-full sm:w-72" />
      </div>

      {loading && <p className="text-slate-500">Loading orders...</p>}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded flex justify-between">
          {error} <button onClick={load} className="underline">Retry</button>
        </div>
      )}
      {!loading && !error && orders.length === 0 && <p className="text-slate-500">No orders yet. Click Create order.</p>}

      {!loading && !error && orders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                {["Order", "Type", "Customer / Supplier", "Order date", "Due date", "Total", "Invoice", "Goods"].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)} className="border-t hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium">#{o.id}</td>
                  <td className="px-4 py-3">{o.order_type === "SALES" ? "Sales" : "Purchase"}</td>
                  <td className="px-4 py-3">{o.party_name}</td>
                  <td className="px-4 py-3">{o.order_date}</td>
                  <td className="px-4 py-3">{o.due_date || "-"}</td>
                  <td className="px-4 py-3">{money(o.total_amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.invoice_status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={o.goods_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <OrderFormModal onClose={() => setShowForm(false)} onSaved={saved} />}
    </div>
  );
}