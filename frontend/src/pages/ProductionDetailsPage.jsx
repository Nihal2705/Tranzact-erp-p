
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Factory, CheckCircle2, Clock3, Package,
  AlertTriangle, CalendarDays, ArrowLeft,
  TrendingUp, RefreshCw
} from "lucide-react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";

const FLOW = ["PLANNED", "PENDING", "WIP", "IN-TESTING", "COMPLETED"];

const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });

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
    month: "long",
    year: "numeric"
  });
};

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

export default function ProductionDetailsPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [progress, setProgress] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/production/${id}`);
      setOrder(data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Could not load production order."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

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
      setError(
        err.response?.data?.error ||
        "Cannot reach the server"
      );
    } finally {
      setConfirm(false);
      setSaving(false);
    }
  }

  if (loading && !order) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-5 w-32 rounded bg-slate-200" />
        <div className="h-10 w-64 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center">
        <AlertTriangle size={32} className="mx-auto text-red-500" />
        <p className="mt-3 text-sm text-red-600">{error}</p>
        <button
          onClick={load}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700"
        >
          <RefreshCw size={15} /> Retry
        </button>
        <div>
          <Link to="/production" className="mt-4 inline-block text-sm text-slate-500 hover:text-teal-700">
            Back to production
          </Link>
        </div>
      </div>
    );
  }

  const idx = FLOW.indexOf(order.status);
  const currentStage = idx >= 0 ? idx : 0;
  const next = idx >= 0 ? FLOW[idx + 1] : null;

  const done = order.status === "COMPLETED";
  const canTrackProgress =
    order.status === "WIP" || order.status === "IN-TESTING";

  const target = Number(order.target_qty) || 0;
  const completed = Number(order.completed_qty) || 0;
  const remaining = Math.max(0, target - completed);

  const pct = target > 0
    ? Math.min(100, Math.max(0, Math.round((completed / target) * 100)))
    : 0;

  const overdue = isOverdue(order.planned_date, order.status);

  const shortages = (order.materials || []).filter(
    m => !done && Number(m.qty_in_stock) < Number(m.qty_needed)
  );

  function updateProgress() {
    const q = Number(progress);

    if (
      progress === "" ||
      !Number.isFinite(q) ||
      q < 0 ||
      q > target
    ) {
      setError(`Enter a number between 0 and ${target}`);
      return;
    }

    update({ completed_qty: q }, "Production progress updated");
  }

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <Link
        to="/production"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-teal-700"
      >
        <ArrowLeft size={16} />
        Back to production
      </Link>

      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Factory size={14} />
            Operations / Production / #{order.id}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">
              Production order #{order.id}
            </h1>
            <StatusBadge status={order.status} />
            {overdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                <AlertTriangle size={13} />
                Overdue
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Manage production stages, monitor material consumption and track output.
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm font-medium text-teal-800">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Target Quantity"
          value={`${target.toLocaleString("en-IN")} ${order.finished_item_unit}`}
          subtitle="Planned production"
          icon={Package}
          color="bg-cyan-50 text-cyan-600"
        />

        <StatCard
          title="Completed"
          value={`${completed.toLocaleString("en-IN")} ${order.finished_item_unit}`}
          subtitle={`${pct}% of target completed`}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Remaining"
          value={`${remaining.toLocaleString("en-IN")} ${order.finished_item_unit}`}
          subtitle="Quantity yet to produce"
          icon={Clock3}
          color="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Total Production Cost"
          value={done ? money(order.total_cost) : "Pending"}
          subtitle={done ? "Final production cost" : "Available on completion"}
          icon={TrendingUp}
          color="bg-teal-50 text-teal-600"
        />
      </div>

      {/* Production overview */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-800">
              Production Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {order.finished_item_name}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <CalendarDays size={15} />
            Planned: {formatDate(order.planned_date)}
          </div>
        </div>

        {/* Stage tracker */}
        <div className="mt-8 overflow-x-auto pb-2">
          <div className="flex min-w-[560px] items-start">
            {FLOW.map((stage, i) => {
              const completedStage = i < currentStage || done;
              const activeStage = i === currentStage && !done;

              return (
                <div key={stage} className="relative flex-1">
                  <div className="flex items-center">
                    <div
                      className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 ${
                        completedStage
                          ? "border-teal-600 bg-teal-600 text-white"
                          : activeStage
                          ? "border-teal-600 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {completedStage
                        ? <CheckCircle2 size={18} />
                        : <span className="text-xs font-bold">{i + 1}</span>}
                    </div>

                    {i !== FLOW.length - 1 && (
                      <div
                        className={`h-1 flex-1 rounded-full ${
                          i < currentStage ? "bg-teal-500" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>

                  <p className={`mt-3 pr-2 text-xs font-semibold ${
                    activeStage || completedStage
                      ? "text-teal-700"
                      : "text-slate-400"
                  }`}>
                    {stage.replace("-", " ")}
                  </p>

                  {activeStage && (
                    <p className="mt-1 text-[10px] text-teal-600">
                      Current stage
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Production Progress
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {completed} of {target} {order.finished_item_unit} completed
              </p>
            </div>

            <span className="text-xl font-bold tabular-nums text-teal-700">
              {pct}%
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                done ? "bg-emerald-500" : "bg-teal-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {canTrackProgress && (
            <div className="mt-6 flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Update completed quantity
                </label>
                <input
                  type="number"
                  min="0"
                  max={target}
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  placeholder="Enter quantity"
                  className="h-11 w-48 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500"
                />
              </div>

              <button
                onClick={updateProgress}
                disabled={saving || progress === ""}
                className="flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                <TrendingUp size={16} />
                {saving ? "Updating..." : "Update progress"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Raw materials */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-800">
              Raw Materials
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Material requirements and current inventory availability.
            </p>
          </div>

          {shortages.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              <AlertTriangle size={14} />
              {shortages.length} material shortage{shortages.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 text-left">Material</th>
                <th className="px-5 py-4 text-right">
                  {done ? "Used" : "Required"}
                </th>
                <th className="px-5 py-4 text-right">Available Stock</th>
                <th className="px-5 py-4 text-left">Availability</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {(order.materials || []).map(m => {
                const short = !done &&
                  Number(m.qty_in_stock) < Number(m.qty_needed);

                return (
                  <tr key={m.raw_item_id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {m.raw_item_name}
                    </td>

                    <td className="px-5 py-4 text-right tabular-nums text-slate-600">
                      {Number(m.qty_needed).toLocaleString("en-IN")} {m.unit}
                    </td>

                    <td className={`px-5 py-4 text-right font-medium tabular-nums ${
                      short ? "text-red-600" : "text-slate-700"
                    }`}>
                      {Number(m.qty_in_stock).toLocaleString("en-IN")} {m.unit}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {short ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                          <AlertTriangle size={12} />
                          Insufficient
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={12} />
                          Available
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {(!order.materials || order.materials.length === 0) && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400">
                    No raw materials listed for this production order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completion banner */}
      {done && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800">
                Production successfully completed!
              </h3>
              <p className="mt-1 text-sm text-emerald-700">
                {target} {order.finished_item_unit} of {order.finished_item_name} has been produced and added to stock.
              </p>
              <p className="mt-2 text-sm text-emerald-800">
                Total production cost: <b>{money(order.total_cost)}</b>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {next && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div>
            <h3 className="font-semibold text-slate-800">
              Next Production Stage
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Move this order to {next.replace("-", " ")}.
            </p>
          </div>

          <button
            onClick={() =>
              next === "COMPLETED"
                ? setConfirm(true)
                : update({ status: next }, `Moved to ${next}`)
            }
            disabled={saving}
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : `Move to ${next.replace("-", " ")}`}
          </button>
        </div>
      )}

      {/* Confirmation modal */}
      {confirm && (
        <Modal
          title="Complete production order?"
          onClose={() => setConfirm(false)}
        >
          <div className="space-y-3">
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle size={18} className="mb-2" />
              This action cannot be undone.
            </div>

            <p className="text-sm text-slate-600">
              <b>{target} {order.finished_item_unit}</b> of{" "}
              <b>{order.finished_item_name}</b> will be added to stock,
              and the raw materials listed above will be used up.
            </p>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setConfirm(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => update(
                  { status: "COMPLETED" },
                  "Production completed"
                )}
                disabled={saving}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm completion"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
