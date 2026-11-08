
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, FileText, Package, Truck, CheckCircle2,
  Clock, CalendarDays, UserRound, IndianRupee,
  AlertCircle, ClipboardList
} from "lucide-react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";

const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
};

function SummaryCard({ title, value, icon: Icon, tone, subtitle }) {
  const colors = {
    teal: "bg-teal-50 text-teal-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600"
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-slate-800">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

export default function OrderDetailsPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [qtys, setQtys] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const requestId = useRef(crypto.randomUUID());

  const load = useCallback(async () => {
    try {
      setError("");

      const [o, t] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get(`/orders/${id}/timeline`)
      ]);

      setOrder(o.data);
      setTimeline(t.data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load order.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const quantities = useMemo(() => {
    if (!order?.lines) {
      return { ordered: 0, fulfilled: 0, remaining: 0 };
    }

    return order.lines.reduce((result, line) => {
      result.ordered += Number(line.quantity || 0);
      result.fulfilled += Number(line.fulfilled_qty || 0);
      result.remaining += Math.max(
        0,
        Number(line.quantity || 0) - Number(line.fulfilled_qty || 0)
      );
      return result;
    }, { ordered: 0, fulfilled: 0, remaining: 0 });
  }, [order]);

  if (!order) {
    return (
      <div className="space-y-4">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-teal-700">
          <ArrowLeft size={16} /> Back to orders
        </Link>

        {error ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button onClick={load} className="ml-3 font-semibold underline">
              Retry
            </button>
          </div>
        ) : (
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-2xl bg-slate-200" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-28 rounded-2xl bg-slate-200" />
              ))}
            </div>
            <div className="h-64 rounded-2xl bg-slate-200" />
          </div>
        )}
      </div>
    );
  }

  const isSales = order.order_type === "SALES";
  const verb = isSales ? "Dispatch" : "Receive";
  const done = isSales ? "Dispatched" : "Received";

  const progress = quantities.ordered > 0
    ? Math.min(100, Math.round(
        quantities.fulfilled / quantities.ordered * 100
      ))
    : 0;

  const toSend = order.lines
    .filter(line => Number(qtys[line.id]) > 0)
    .map(line => ({
      line,
      qty: Number(qtys[line.id])
    }));

  function reviewGoods() {
    setError("");

    for (const { line, qty } of toSend) {
      const remaining = line.quantity - line.fulfilled_qty;

      if (qty > remaining) {
        return setError(
          `Only ${remaining} ${line.unit} of ${line.item_name} left to ${verb.toLowerCase()}.`
        );
      }
    }

    if (toSend.length === 0) {
      return setError(`Enter a quantity to ${verb.toLowerCase()}.`);
    }

    setConfirm("goods");
  }

  async function run(body, message) {
    setSaving(true);
    setError("");

    try {
      await api.put(`/orders/${id}/status`, body);

      setConfirm(null);
      setQtys({});
      requestId.current = crypto.randomUUID();

      setToast(message);
      setTimeout(() => setToast(""), 3000);

      await load();
    } catch (err) {
      setConfirm(null);
      setError(
        err.response?.data?.error || "Cannot reach the server."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-teal-700"
      >
        <ArrowLeft size={17} />
        Back to orders
      </Link>

      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            Dashboard <span>/</span> Orders <span>/</span>
            <span className="text-teal-700">#{order.id}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            {isSales ? "Sales Order" : "Purchase Order"} #{order.id}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review order information, monitor fulfilment and manage transactions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.invoice_status} />
          <StatusBadge status={order.goods_status} />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Order information */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <UserRound size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">
                {isSales ? "Customer" : "Supplier"}
              </p>
              <p className="font-semibold text-slate-800">{order.party_name}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Order Date</p>
              <p className="font-semibold text-slate-800">
                {formatDate(order.order_date)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Due Date</p>
              <p className="font-semibold text-slate-800">
                {formatDate(order.due_date)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Order Amount"
          value={money(order.total_amount)}
          subtitle="Total transaction value"
          icon={IndianRupee}
          tone="teal"
        />

        <SummaryCard
          title="Total Quantity"
          value={quantities.ordered.toLocaleString("en-IN")}
          subtitle="Total items ordered"
          icon={Package}
          tone="blue"
        />

        <SummaryCard
          title={done}
          value={quantities.fulfilled.toLocaleString("en-IN")}
          subtitle="Quantity fulfilled so far"
          icon={CheckCircle2}
          tone="teal"
        />

        <SummaryCard
          title="Remaining"
          value={quantities.remaining.toLocaleString("en-IN")}
          subtitle="Quantity yet to be fulfilled"
          icon={Truck}
          tone="amber"
        />
      </div>

      {/* Fulfilment progress */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">
              Fulfilment Progress
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Overall order completion
            </p>
          </div>

          <span className="text-xl font-bold tabular-nums text-teal-700">
            {progress}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress === 100 ? "bg-teal-500" : "bg-amber-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between text-xs text-slate-400">
          <span>{quantities.fulfilled} fulfilled</span>
          <span>{quantities.remaining} remaining</span>
        </div>
      </div>

      {/* Order items */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-800">Order Items</h2>
            <p className="mt-1 text-xs text-slate-400">
              Manage quantities and monitor item fulfilment
            </p>
          </div>

          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {order.lines.length} Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 text-left">Item</th>
                <th className="px-5 py-4 text-right">Ordered</th>
                <th className="px-5 py-4 text-right">{done}</th>
                <th className="px-5 py-4 text-right">Remaining</th>
                <th className="px-5 py-4 text-center">Fulfilment</th>
                <th className="px-5 py-4 text-right">{verb} Now</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {order.lines.map(line => {
                const remaining = Math.max(
                  0,
                  line.quantity - line.fulfilled_qty
                );

                const percent = line.quantity > 0
                  ? Math.min(100, Math.round(
                      line.fulfilled_qty / line.quantity * 100
                    ))
                  : 0;

                return (
                  <tr key={line.id} className="transition hover:bg-teal-50/40">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {line.item_name}
                      <p className="mt-1 text-xs font-normal text-slate-400">
                        Unit: {line.unit}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right tabular-nums text-slate-600">
                      {line.quantity}
                    </td>

                    <td className="px-5 py-4 text-right font-medium tabular-nums text-teal-700">
                      {line.fulfilled_qty}
                    </td>

                    <td className="px-5 py-4 text-right tabular-nums text-slate-600">
                      {remaining}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              percent === 100 ? "bg-teal-500" : "bg-amber-400"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs font-medium tabular-nums text-slate-500">
                          {percent}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {remaining > 0 ? (
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          value={qtys[line.id] || ""}
                          onChange={e =>
                            setQtys({
                              ...qtys,
                              [line.id]: e.target.value
                            })
                          }
                          className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                          placeholder="0"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600">
                          <CheckCircle2 size={15} /> Complete
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {order.invoice_status === "Pending" && (
          <button
            onClick={() => setConfirm("invoice")}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-600 bg-white px-5 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
          >
            <FileText size={17} />
            Create Invoice
          </button>
        )}

        {order.goods_status !== "Dispatched" &&
          order.goods_status !== "Received" &&
          order.goods_status !== "Delivered" &&
          quantities.remaining > 0 && (
          <button
            onClick={reviewGoods}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Truck size={17} />
            {verb} Goods
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Order Timeline</h2>
            <p className="text-xs text-slate-400">
              Track all activities related to this order
            </p>
          </div>
        </div>

        {timeline.length === 0 ? (
          <p className="py-5 text-sm text-slate-400">
            No timeline activities available yet.
          </p>
        ) : (
          <div className="relative ml-2 space-y-5 border-l-2 border-slate-100 pl-6">
            {timeline.map((t, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[33px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-teal-500 bg-white">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {t.event}
                  </p>
                  {t.details && (
                    <p className="mt-1 text-sm text-slate-500">
                      {t.details}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(t.date).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <Modal
          title="Please confirm"
          onClose={() => setConfirm(null)}
        >
          {confirm === "invoice" ? (
            <p className="text-sm text-slate-600">
              Create the invoice for order #{order.id}? This cannot be undone.
            </p>
          ) : (
            <div>
              <p className="mb-3 text-sm text-slate-600">
                {verb} these items? Stock will go {isSales ? "down" : "up"}.
              </p>

              <ul className="space-y-2">
                {toSend.map(({ line, qty }) => (
                  <li
                    key={line.id}
                    className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-700">{line.item_name}</span>
                    <span className="font-semibold text-slate-800">
                      {qty} {line.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setConfirm(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              onClick={() =>
                confirm === "invoice"
                  ? run(
                      { invoice_status: "Created" },
                      "Invoice created successfully"
                    )
                  : run(
                      {
                        dispatch: toSend.map(({ line, qty }) => ({
                          order_item_id: line.id,
                          qty
                        })),
                        request_id: requestId.current
                      },
                      `Goods ${done.toLowerCase()} successfully`
                    )
              }
              className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
