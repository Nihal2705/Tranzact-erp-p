import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import api from "../services/api";

const money = (n) => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const STATUS_COLORS = {
  PLANNED: "#3b82f6", PENDING: "#ef4444", WIP: "#eab308", "IN-TESTING": "#6b7280", COMPLETED: "#22c55e",
};

function Kpi({ label, value, warn }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${warn ? "text-red-600" : "text-teal-700"}`}>{value}</p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <h2 className="font-bold text-slate-800 mb-3">{title}</h2>
      {children}
    </div>
  );
}

const Empty = () => <p className="text-slate-500 text-sm">No data yet.</p>;

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const res = await api.get("/reports/summary");
      setData(res.data);
    } catch (err) {
      setError(err.response?.status === 403 ? "You do not have permission to view the dashboard." : "Could not load the dashboard.");
    }
  }

  useEffect(() => { load(); }, []);

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-3 rounded flex justify-between">
        {error} <button onClick={load} className="underline">Retry</button>
      </div>
    );
  }
  if (!data) return <p className="text-slate-500">Loading dashboard...</p>;

  const k = data.kpis;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Kpi label="Total stock valuation" value={money(k.stock_value)} />
        <Kpi label="Low-stock items" value={k.low_stock_count} warn={k.low_stock_count > 0} />
        <Kpi label="Orders this month" value={k.orders_this_month} />
        <Kpi label="Pending invoices" value={k.pending_invoices} warn={k.pending_invoices > 0} />
        <Kpi label="Orders not dispatched" value={k.orders_not_dispatched} />
        <Kpi label="Completed production orders" value={k.production_completed} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Orders per month">
          {data.orders_per_month.length === 0 ? <Empty /> : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={data.orders_per_month}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name="Orders" fill="#0d9488" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Stock value by item">
          {data.stock_by_item.length === 0 ? <Empty /> : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={data.stock_by_item}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Bar dataKey="value" name="Value" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Production status">
          {data.production_by_status.length === 0 ? <Empty /> : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.production_by_status} dataKey="count" nameKey="status" outerRadius={80} label>
                    {data.production_by_status.map((s) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status] || "#9ca3af"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Low-stock items">
          {data.low_stock_items.length === 0 ? <p className="text-slate-500 text-sm">All items are above their limits 👍</p> : (
            <ul className="divide-y text-sm">
              {data.low_stock_items.map((i) => (
                <li key={i.id} className="py-2 flex justify-between">
                  <span>⚠️ {i.name}</span>
                  <span className="text-red-600">{i.quantity} / {i.low_stock_limit} {i.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Late orders">
          {data.late_orders.length === 0 ? <p className="text-slate-500 text-sm">No late orders 👍</p> : (
            <ul className="divide-y text-sm">
              {data.late_orders.map((o) => (
                <li key={o.id} className="py-2 flex justify-between">
                  <Link to={`/orders/${o.id}`} className="text-teal-700 hover:underline">
                    #{o.id} · {o.party_name}
                  </Link>
                  <span className="text-red-600">Due {o.due_date} · {o.goods_status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}