
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Factory, CheckCircle2, Clock3, AlertTriangle,
  CalendarDays, Plus, Search, Package, RefreshCw
} from "lucide-react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import ProductionFormModal from "../components/ProductionFormModal";

const STATUSES = ["PLANNED", "PENDING", "WIP", "IN-TESTING", "COMPLETED"];

const isOverdue = (date, status) => {
  if (!date || status === "COMPLETED") return false;
  const planned = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return planned < today;
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

export default function ProductionPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canCreate = user.role === "Admin" || user.role === "Manager";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/production", {
        params: { status }
      });
      setOrders(data);
    } catch {
      setError("Could not load production orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  function saved(message) {
    setShowForm(false);
    setToast(message);
    load();
    setTimeout(() => setToast(""), 3000);
  }

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase().trim();
    return orders.filter((o) =>
      String(o.id).includes(query) ||
      (o.finished_item_name || "").toLowerCase().includes(query)
    );
  }, [orders, search]);

  const stats = useMemo(() => ({
    total: orders.length,
    completed: orders.filter(o => o.status === "COMPLETED").length,
    inProgress: orders.filter(o =>
      ["WIP", "IN-TESTING"].includes(o.status)
    ).length,
    overdue: orders.filter(o =>
      isOverdue(o.planned_date, o.status)
    ).length,
  }), [orders]);

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Factory size={14} />
            Operations / Production
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">
            Production
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track manufacturing plans, completion and production progress.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus size={18} />
            Create production order
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm font-medium text-teal-800">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Plans"
          value={stats.total}
          subtitle="Production orders"
          icon={Factory}
          color="bg-cyan-50 text-cyan-600"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          subtitle="Successfully finished"
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          subtitle="Currently being processed"
          icon={Clock3}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          subtitle="Past planned date"
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Table section */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div>
            <h2 className="font-semibold text-slate-800">
              Production Orders
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Manage and monitor your production activities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search production..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white sm:w-56"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-500"
            >
              <option value="">All statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.replace("-", " ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 p-5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex animate-pulse gap-4">
                <div className="h-5 w-16 rounded bg-slate-100" />
                <div className="h-5 flex-1 rounded bg-slate-100" />
                <div className="h-5 w-24 rounded bg-slate-100" />
                <div className="h-5 w-20 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto text-red-500" size={30} />
            <p className="mt-3 text-sm text-red-600">{error}</p>
            <button
              onClick={load}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-700"
            >
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600">
              <Package size={27} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-800">
              {search ? "No matching production orders" : "No production orders yet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try another item name or order number."
                : "Create your first production plan to get started."}
            </p>
            {!search && canCreate && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Create production order
              </button>
            )}
          </div>
        )}

        {/* Production table */}
        {!loading && !error && filteredOrders.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left">Order</th>
                    <th className="px-5 py-4 text-left">Finished Good</th>
                    <th className="px-5 py-4 text-right">Target</th>
                    <th className="px-5 py-4 text-right">Completed</th>
                    <th className="px-5 py-4 text-left min-w-40">Progress</th>
                    <th className="px-5 py-4 text-left">Status</th>
                    <th className="px-5 py-4 text-left">Planned Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(o => {
                    const pct = o.target_qty > 0
                      ? Math.min(100, Math.max(0,
                          Math.round((o.completed_qty / o.target_qty) * 100)))
                      : 0;

                    const overdue = isOverdue(o.planned_date, o.status);

                    return (
                      <tr
                        key={o.id}
                        onClick={() => navigate(`/production/${o.id}`)}
                        className="cursor-pointer transition hover:bg-teal-50/40"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-teal-700">
                          #PRD-{String(o.id).padStart(3, "0")}
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-800">
                          {o.finished_item_name}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-slate-600">
                          {Number(o.target_qty).toLocaleString("en-IN")} {o.finished_item_unit}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums text-slate-700">
                          {Number(o.completed_qty).toLocaleString("en-IN")}
                        </td>

                        <td className="min-w-40 px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct === 100 ? "bg-emerald-500" : "bg-teal-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-9 text-right text-xs font-semibold text-slate-600">
                              {pct}%
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <StatusBadge status={o.status} />
                          {overdue && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">
                              <AlertTriangle size={11} />
                              Overdue
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          <span className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-slate-400" />
                            {formatDate(o.planned_date)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              <span>Showing {filteredOrders.length} production orders</span>
              <span>Click a row to view details →</span>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <ProductionFormModal
          onClose={() => setShowForm(false)}
          onSaved={saved}
        />
      )}
    </div>
  );
}
