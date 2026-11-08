import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import {
  IndianRupee, AlertTriangle, ShoppingCart, FileText, Truck, CheckCircle2, CircleCheck,
} from "lucide-react";
import api from "../services/api";

const money = (n) => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const STATUS_COLORS = {
  PLANNED: "#3b82f6", PENDING: "#ef4444", WIP: "#f59e0b", "IN-TESTING": "#94a3b8", COMPLETED: "#22c55e",
};
const DONUT = ["#0d9488", "#f59e0b", "#64748b", "#3b82f6", "#ef4444", "#8b5cf6", "#22c55e", "#ec4899"];

const TONES = {
  teal: "bg-teal-50 text-teal-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  blue: "bg-sky-50 text-sky-600",
  green: "bg-emerald-50 text-emerald-600",
};

function Kpi({ label, value, icon: Icon, tone = "teal", warn }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${TONES[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500">{label}</p>
        <p className={`text-2xl font-bold ${warn ? "text-red-600" : "text-slate-900"}`}>{value}</p>
      </div>
    </div>
  );
}

function Card({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>
      <h2 className="mb-4 font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  );
}

const Empty = () => <p className="text-sm text-slate-500">No data yet.</p>;

function Donut({ data, nameKey, valueKey, colorFor, center, format = (v) => v }) {
  const total = data.reduce((s, d) => s + Number(d[valueKey]), 0);
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="relative h-48 w-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius={58} outerRadius={85} paddingAngle={2} stroke="none">
              {data.map((d, i) => <Cell key={d[nameKey]} fill={colorFor(d, i)} />)}
            </Pie>
            <Tooltip formatter={(v) => format(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-lg font-bold text-slate-900">{center}</div>
            <div className="text-xs text-slate-500">Total</div>
          </div>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d[nameKey]} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorFor(d, i) }} />
            <span className="text-slate-600">{d[nameKey]}</span>
            <span className="ml-auto pl-3 font-medium text-slate-800">
              {total ? Math.round((Number(d[valueKey]) / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
      <div className="flex justify-between rounded-xl bg-red-50 p-3 text-red-700">
        {error} <button onClick={load} className="underline">Retry</button>
      </div>
    );
  }
  if (!data) return <p className="text-slate-500">Loading dashboard...</p>;

  const k = data.kpis;
  const prodTotal = data.production_by_status.reduce((s, d) => s + d.count, 0);
  const stockTotal = data.stock_by_item.reduce((s, d) => s + Number(d.value), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Here's what's happening with your business today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi label="Total stock valuation" value={money(k.stock_value)} icon={IndianRupee} tone="teal" />
        <Kpi label="Low-stock items" value={k.low_stock_count} icon={AlertTriangle} tone="red" warn={k.low_stock_count > 0} />
        <Kpi label="Orders this month" value={k.orders_this_month} icon={ShoppingCart} tone="amber" />
        <Kpi label="Pending invoices" value={k.pending_invoices} icon={FileText} tone="red" warn={k.pending_invoices > 0} />
        <Kpi label="Orders not dispatched" value={k.orders_not_dispatched} icon={Truck} tone="blue" />
        <Kpi label="Completed production" value={k.production_completed} icon={CheckCircle2} tone="green" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Orders per month" className="lg:col-span-1">
          {data.orders_per_month.length === 0 ? <Empty /> : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={data.orders_per_month}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="count" name="Orders" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Stock value by item">
          {data.stock_by_item.length === 0 ? <Empty /> : (
            <Donut
              data={data.stock_by_item}
              nameKey="name"
              valueKey="value"
              colorFor={(_, i) => DONUT[i % DONUT.length]}
              center={money(stockTotal)}
              format={money}
            />
          )}
        </Card>

        <Card title="Production status">
          {data.production_by_status.length === 0 ? <Empty /> : (
            <Donut
              data={data.production_by_status}
              nameKey="status"
              valueKey="count"
              colorFor={(d) => STATUS_COLORS[d.status] || "#9ca3af"}
              center={prodTotal}
            />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Low-stock items">
          {data.low_stock_items.length === 0 ? <p className="text-sm text-slate-500">All items are above their limits 👍</p> : (
            <ul className="divide-y text-sm">
              {data.low_stock_items.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-2"><AlertTriangle size={15} className="text-red-500" /> {i.name}</span>
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                    {i.quantity} / {i.low_stock_limit} {i.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Late orders">
          {data.late_orders.length === 0 ? <p className="text-sm text-slate-500">No late orders 👍</p> : (
            <ul className="divide-y text-sm">
              {data.late_orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5">
                  <Link to={`/orders/${o.id}`} className="font-medium text-teal-700 hover:underline">
                    #{o.id} · {o.party_name}
                  </Link>
                  <span className="text-xs text-red-600">Due {o.due_date} · {o.goods_status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50 px-5 py-3 text-sm text-teal-800">
        <CircleCheck size={18} />
        <span><b>System running smoothly!</b> All modules are up to date.</span>
      </div>
    </div>
  );
}