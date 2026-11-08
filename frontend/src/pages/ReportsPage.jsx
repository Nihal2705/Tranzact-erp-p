
import { useEffect, useMemo, useState } from "react";
import {
  FileBarChart, Package, ShoppingCart, Truck,
  Factory, IndianRupee, TrendingUp, CheckCircle2,
  Clock3, AlertTriangle, Download, Search,
  CalendarDays, RefreshCw, FileSpreadsheet
} from "lucide-react";
import api from "../services/api";
import { downloadCsv } from "../utils/csv";

const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });

const number = (n) =>
  Number(n || 0).toLocaleString("en-IN");

const REPORTS = {
  stock: {
    label: "Stock Report",
    url: "/items",
    dates: false,
    file: "stock-report.csv",
    icon: Package,
    columns: ["Item", "Type", "Quantity", "Unit", "Price", "Value"],
    row: (i) => [
      i.name, i.item_type, i.quantity, i.unit,
      i.price, i.quantity * i.price
    ],
  },

  sales: {
    label: "Sales Register",
    url: "/orders",
    params: { order_type: "SALES" },
    dates: true,
    file: "sales-orders.csv",
    icon: ShoppingCart,
    columns: [
      "Order", "Customer", "Order date", "Due date",
      "Total", "Invoice", "Goods"
    ],
    row: (o) => [
      "#" + o.id, o.party_name, o.order_date,
      o.due_date || "", o.total_amount,
      o.invoice_status, o.goods_status
    ],
  },

  purchase: {
    label: "Purchase Register",
    url: "/orders",
    params: { order_type: "PURCHASE" },
    dates: true,
    file: "purchase-orders.csv",
    icon: Truck,
    columns: [
      "Order", "Supplier", "Order date", "Due date",
      "Total", "Invoice", "Goods"
    ],
    row: (o) => [
      "#" + o.id, o.party_name, o.order_date,
      o.due_date || "", o.total_amount,
      o.invoice_status, o.goods_status
    ],
  },

  production: {
    label: "Production Report",
    url: "/production",
    dates: true,
    file: "production-report.csv",
    icon: Factory,
    columns: [
      "Order", "Finished good", "Target", "Completed",
      "Status", "Planned date", "Total cost"
    ],
    row: (p) => [
      "#" + p.id, p.finished_item_name,
      p.target_qty, p.completed_qty,
      p.status, p.planned_date || "",
      p.total_cost ?? ""
    ],
  },
};

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>
          <p className="mt-2 truncate text-2xl font-bold text-slate-800">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ value }) {
  const status = String(value || "").toUpperCase();

  let color = "bg-slate-100 text-slate-600";

  if (
    ["COMPLETED", "DELIVERED", "DISPATCHED", "CREATED", "RECEIVED", "IN STOCK"].includes(status)
  ) {
    color = "bg-emerald-50 text-emerald-700";
  } else if (
    ["PENDING", "PLANNED", "WIP", "IN-TESTING", "IN PROGRESS"].includes(status)
  ) {
    color = "bg-amber-50 text-amber-700";
  } else if (
    ["CANCELLED", "OVERDUE", "LOW STOCK", "REJECTED"].includes(status)
  ) {
    color = "bg-red-50 text-red-600";
  } else if (
    ["IN TRANSIT", "SHIPPED"].includes(status)
  ) {
    color = "bg-blue-50 text-blue-700";
  }

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
      {value}
    </span>
  );
}

function Summary({ report, rows }) {
  const total = (index) =>
    rows.reduce((sum, row) => sum + (Number(row[index]) || 0), 0);

  const countStatus = (index, value) =>
    rows.filter(
      row => String(row[index] || "").toUpperCase() === value
    ).length;

  let cards = [];

  if (report === "stock") {
    cards = [
      {
        title: "Total Stock Value",
        value: money(total(5)),
        subtitle: "Current inventory valuation",
        icon: IndianRupee,
        color: "bg-teal-50 text-teal-600",
      },
      {
        title: "Total Items",
        value: number(rows.length),
        subtitle: "Inventory records",
        icon: Package,
        color: "bg-cyan-50 text-cyan-600",
      },
      {
        title: "Total Quantity",
        value: number(total(2)),
        subtitle: "Combined stock quantity",
        icon: BoxesIcon,
        color: "bg-violet-50 text-violet-600",
      },
    ];
  }

  if (report === "sales") {
    cards = [
      {
        title: "Total Sales",
        value: money(total(4)),
        subtitle: "Sales order value",
        icon: IndianRupee,
        color: "bg-teal-50 text-teal-600",
      },
      {
        title: "Total Orders",
        value: number(rows.length),
        subtitle: "Customer orders",
        icon: ShoppingCart,
        color: "bg-cyan-50 text-cyan-600",
      },
      {
        title: "Pending Dispatch",
        value: number(countStatus(6, "PENDING")),
        subtitle: "Awaiting dispatch",
        icon: Truck,
        color: "bg-amber-50 text-amber-600",
      },
    ];
  }

  if (report === "purchase") {
    cards = [
      {
        title: "Total Purchases",
        value: money(total(4)),
        subtitle: "Purchase order value",
        icon: IndianRupee,
        color: "bg-teal-50 text-teal-600",
      },
      {
        title: "Total Orders",
        value: number(rows.length),
        subtitle: "Supplier orders",
        icon: ShoppingCart,
        color: "bg-cyan-50 text-cyan-600",
      },
      {
        title: "Pending Receipts",
        value: number(countStatus(6, "PENDING")),
        subtitle: "Awaiting goods receipt",
        icon: Package,
        color: "bg-amber-50 text-amber-600",
      },
    ];
  }

  if (report === "production") {
    cards = [
      {
        title: "Total Production Plans",
        value: number(rows.length),
        subtitle: "Production records",
        icon: Factory,
        color: "bg-cyan-50 text-cyan-600",
      },
      {
        title: "Completed Plans",
        value: number(countStatus(4, "COMPLETED")),
        subtitle: "Successfully completed",
        icon: CheckCircle2,
        color: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Total Production Cost",
        value: money(total(6)),
        subtitle: "Recorded production cost",
        icon: IndianRupee,
        color: "bg-amber-50 text-amber-600",
      },
    ];
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function BoxesIcon(props) {
  return <Package {...props} />;
}

function formatDate(value) {
  if (!value || typeof value !== "string") return value;
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;

  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function isNumericColumn(report, column) {
  return (
    ["Quantity", "Price", "Value", "Total", "Target",
      "Completed", "Total cost"].includes(column)
  );
}

function isMoneyColumn(column) {
  return ["Price", "Value", "Total", "Total cost"].includes(column);
}

function renderCell(report, column, value) {
  if (column === "Type") {
    const raw = String(value || "").toUpperCase();
    const finished = raw === "FINISHED";

    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        finished
          ? "bg-amber-100 text-amber-700"
          : "bg-cyan-100 text-cyan-700"
      }`}>
        {raw}
      </span>
    );
  }

  if (["Status", "Invoice", "Goods"].includes(column)) {
    return <StatusPill value={value || "-"} />;
  }

  if (["Order date", "Due date", "Planned date"].includes(column)) {
    return formatDate(value) || "-";
  }

  if (isMoneyColumn(column)) {
    return money(value);
  }

  if (isNumericColumn(report, column)) {
    return number(value);
  }

  return value === "" || value == null ? "-" : value;
}

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
      const params = {
        ...(cfg.params || {}),
        ...(cfg.dates ? { from, to } : {}),
      };

      const { data } = await api.get(cfg.url, { params });
      setRows(data.map(cfg.row));
    } catch {
      setError("Could not load the report. Please try again.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [key, from, to]);

  const shown = useMemo(() => {
    return rows.filter(row =>
      row.some(cell =>
        String(cell ?? "").toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [rows, search]);

  const Icon = cfg.icon;

  const rightAligned = (column) => isNumericColumn(key, column);

  return (
    <div className="space-y-6">

      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileBarChart size={14} />
            Business / Reports
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-800">
            Reports & Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View business performance, inventory and operational reports.
          </p>
        </div>

        <button
          onClick={() => downloadCsv(cfg.columns, shown, cfg.file)}
          disabled={loading || shown.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={17} />
          Export CSV
        </button>
      </div>

      {/* Report tabs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Object.entries(REPORTS).map(([k, report]) => {
          const TabIcon = report.icon;
          const active = key === k;

          return (
            <button
              key={k}
              onClick={() => {
                setKey(k);
                setSearch("");
              }}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-teal-500 bg-teal-50 shadow-sm"
                  : "border-slate-100 bg-white hover:border-teal-200 hover:bg-slate-50"
              }`}
            >
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                active
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}>
                <TabIcon size={20} />
              </div>

              <div className="min-w-0">
                <p className={`truncate text-sm font-semibold ${
                  active ? "text-teal-800" : "text-slate-700"
                }`}>
                  {report.label}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {active ? "Currently viewing" : "View report"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary cards */}
      {!loading && !error && (
        <Summary report={key} rows={rows} />
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">

          {cfg.dates && (
            <>
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <CalendarDays size={14} />
                  From date
                </label>
                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={e => setFrom(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <CalendarDays size={14} />
                  To date
                </label>
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={e => setTo(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-teal-500"
                />
              </div>
            </>
          )}

          <div className="relative min-w-[200px] flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${cfg.label.toLowerCase()}...`}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white"
            />
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Report table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <Icon size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">
                {cfg.label}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {loading ? "Updating records..." : `${shown.length} records found`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileSpreadsheet size={15} />
            CSV compatible
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse p-5">
            <div className="mb-5 h-8 rounded-lg bg-slate-100" />
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="mb-3 h-12 rounded-lg bg-slate-50" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertTriangle size={30} className="mx-auto text-red-400" />
            <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
            <button
              onClick={load}
              className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
            >
              Try again
            </button>
          </div>
        ) : shown.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-400">
              <FileBarChart size={26} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-700">
              No records found
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Try changing your search or date filters.
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-3 text-sm font-semibold text-teal-700 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {cfg.columns.map(column => (
                      <th
                        key={column}
                        className={`whitespace-nowrap px-5 py-4 font-semibold ${
                          rightAligned(column) ? "text-right" : "text-left"
                        }`}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {shown.map((row, i) => (
                    <tr
                      key={i}
                      className="transition-colors hover:bg-teal-50/40"
                    >
                      {row.map((cell, j) => {
                        const column = cfg.columns[j];
                        const numeric = rightAligned(column);

                        return (
                          <td
                            key={j}
                            className={`whitespace-nowrap px-5 py-4 ${
                              numeric
                                ? "text-right tabular-nums font-medium text-slate-700"
                                : "text-left text-slate-600"
                            } ${
                              j === 0
                                ? "font-semibold text-slate-800"
                                : ""
                            }`}
                          >
                            {renderCell(key, column, cell)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-500">
                Showing {shown.length} of {rows.length} records
              </p>

              <button
                onClick={() => downloadCsv(cfg.columns, shown, cfg.file)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 hover:text-teal-900"
              >
                <Download size={14} />
                Download this report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
