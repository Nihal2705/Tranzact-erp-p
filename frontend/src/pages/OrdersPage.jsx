
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, TrendingUp, Package, Truck,
  Search, Plus, ArrowUpRight, ArrowDownRight,
  RefreshCw, ClipboardList
} from "lucide-react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import OrderFormModal from "../components/OrderFormModal";

const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });

const TABS = [
  ["", "All Orders"],
  ["SALES", "Sales"],
  ["PURCHASE", "Purchase"]
];

const SummaryCard = ({ title, value, subtitle, icon: Icon, tone }) => {
  const tones = {
    teal: "bg-teal-50 text-teal-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600"
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-800">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
};

function TypeBadge({ type }) {
  const sales = type === "SALES";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
      sales
        ? "bg-teal-50 text-teal-700 ring-1 ring-teal-100"
        : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
    }`}>
      {sales ? "Sales" : "Purchase"}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-28 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-slate-200/70" />
    </div>
  );
}

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
      const { data } = await api.get("/orders", {
        params: { order_type: type, search }
      });
      setOrders(data);
    } catch {
      setError("Could not load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [type, search]);

  function saved(message) {
    setShowForm(false);
    setToast(message);
    load();
    setTimeout(() => setToast(""), 3000);
  }

  const summary = useMemo(() => {
    const sales = orders.filter(o => o.order_type === "SALES");
    const purchases = orders.filter(o => o.order_type === "PURCHASE");

    return {
      total: orders.length,
      sales: sales.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      purchases: purchases.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      pending: orders.filter(o =>
        !["Dispatched", "Received", "Delivered"].includes(o.goods_status)
      ).length
    };
  }, [orders]);

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

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-teal-700">Orders</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage your customer and supplier orders.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Plus size={18} />
          Create Order
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-100">✓</span>
          {toast}
        </div>
      )}

      {/* Summary cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Orders"
            value={summary.total}
            subtitle="Orders matching current filters"
            icon={ClipboardList}
            tone="teal"
          />
          <SummaryCard
            title="Sales Value"
            value={money(summary.sales)}
            subtitle="Total sales order value"
            icon={TrendingUp}
            tone="blue"
          />
          <SummaryCard
            title="Purchase Value"
            value={money(summary.purchases)}
            subtitle="Total purchase order value"
            icon={ShoppingCart}
            tone="amber"
          />
          <SummaryCard
            title="Pending Fulfilment"
            value={summary.pending}
            subtitle="Orders not fully fulfilled"
            icon={Truck}
            tone="violet"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <div className="flex w-full gap-1 rounded-xl bg-slate-100 p-1 sm:w-auto">
          {TABS.map(([value, label]) => (
            <button
              key={label}
              onClick={() => setType(value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                type === value
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer / supplier..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && <Skeleton />}

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            onClick={load}
            className="inline-flex items-center gap-2 font-semibold hover:underline"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Orders table */}
      {!loading && !error && orders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-800">Order Overview</h2>
              <p className="mt-1 text-xs text-slate-400">
                View and manage all your orders
              </p>
            </div>
            <span className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
              {orders.length} Orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left">Order ID</th>
                  <th className="px-5 py-4 text-left">Type</th>
                  <th className="px-5 py-4 text-left">Customer / Supplier</th>
                  <th className="px-5 py-4 text-left">Order Date</th>
                  <th className="px-5 py-4 text-left">Due Date</th>
                  <th className="px-5 py-4 text-right">Total Amount</th>
                  <th className="px-5 py-4 text-left">Invoice</th>
                  <th className="px-5 py-4 text-left">Goods</th>
                  <th className="px-5 py-4 text-center">View</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className="cursor-pointer transition-colors hover:bg-teal-50/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                      #{o.id}
                    </td>

                    <td className="px-5 py-4">
                      <TypeBadge type={o.order_type} />
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {o.party_name}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(o.order_date)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(o.due_date)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-slate-800">
                      {money(o.total_amount)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={o.invoice_status} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={o.goods_status} />
                    </td>

                    <td className="px-5 py-4 text-center">
                      <ArrowUpRight
                        size={17}
                        className="inline text-slate-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">
            <span>Showing {orders.length} orders</span>
            <span>Click an order to view its details →</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600">
            <ShoppingCart size={26} />
          </div>
          <h3 className="font-semibold text-slate-800">No orders found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create a new order or try changing your search filters.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            + Create your first order
          </button>
        </div>
      )}

      {showForm && (
        <OrderFormModal
          onClose={() => setShowForm(false)}
          onSaved={saved}
        />
      )}
    </div>
  );
}
