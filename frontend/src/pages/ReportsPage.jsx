import { useEffect, useState } from "react";
import api from "../services/api";
import { downloadCsv } from "../utils/csv";

const REPORTS = {
  stock: {
    label: "Stock report", url: "/items", dates: false, file: "stock-report.csv",
    columns: ["Item", "Type", "Quantity", "Unit", "Price", "Value"],
    row: (i) => [i.name, i.item_type, i.quantity, i.unit, i.price, i.quantity * i.price],
  },
  sales: {
    label: "Sales order register", url: "/orders", params: { order_type: "SALES" }, dates: true, file: "sales-orders.csv",
    columns: ["Order", "Customer", "Order date", "Due date", "Total", "Invoice", "Goods"],
    row: (o) => ["#" + o.id, o.party_name, o.order_date, o.due_date || "", o.total_amount, o.invoice_status, o.goods_status],
  },
  purchase: {
    label: "Purchase order register", url: "/orders", params: { order_type: "PURCHASE" }, dates: true, file: "purchase-orders.csv",
    columns: ["Order", "Supplier", "Order date", "Due date", "Total", "Invoice", "Goods"],
    row: (o) => ["#" + o.id, o.party_name, o.order_date, o.due_date || "", o.total_amount, o.invoice_status, o.goods_status],
  },
  production: {
    label: "Production report", url: "/production", dates: true, file: "production-report.csv",
    columns: ["Order", "Finished good", "Target", "Completed", "Status", "Planned date", "Total cost"],
    row: (p) => ["#" + p.id, p.finished_item_name, p.target_qty, p.completed_qty, p.status, p.planned_date || "", p.total_cost ?? ""],
  },
};

export default function ReportsPage() {
  const [key, setKey] = useState("stock");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cfg = REPORTS[key];

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = { ...(cfg.params || {}), ...(cfg.dates ? { from, to } : {}) };
      const { data } = await api.get(cfg.url, { params });
      setRows(data.map(cfg.row));
    } catch {
      setError("Could not load the report.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [key, from, to]);

  const shown = rows.filter((r) => r.some((c) => String(c).toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Reports</h1>

      <div className="flex flex-wrap gap-2">
        {Object.entries(REPORTS).map(([k, r]) => (
          <button key={k} onClick={() => { setKey(k); setSearch(""); }}
            className={`px-4 py-2 rounded-lg text-sm border ${key === k ? "bg-teal-600 text-white border-teal-600" : "bg-white hover:bg-slate-50"}`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        {cfg.dates && (
          <>
            <label className="text-sm text-slate-600">From
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="block border rounded-lg px-3 py-2 bg-white" />
            </label>
            <label className="text-sm text-slate-600">To
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="block border rounded-lg px-3 py-2 bg-white" />
            </label>
          </>
        )}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
          className="border rounded-lg px-3 py-2 bg-white w-full sm:w-64" />
        <button onClick={() => downloadCsv(cfg.columns, shown, cfg.file)} disabled={shown.length === 0}
          className="ml-auto px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-40">
          Download CSV
        </button>
      </div>

      {loading && <p className="text-slate-500">Loading report...</p>}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded flex justify-between">
          {error} <button onClick={load} className="underline">Retry</button>
        </div>
      )}
      {!loading && !error && shown.length === 0 && <p className="text-slate-500">No records found.</p>}

      {!loading && !error && shown.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>{cfg.columns.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={i} className="border-t">
                  {r.map((c, j) => <td key={j} className="px-4 py-3">{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-slate-500 border-t">{shown.length} record(s)</p>
        </div>
      )}
    </div>
  );
}