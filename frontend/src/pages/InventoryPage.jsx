
import { useEffect, useMemo, useState } from "react";
import {
  Package, Boxes, CheckCircle2, IndianRupee,
  Search, Plus, AlertTriangle, History, Pencil,
  ArrowLeft, ArrowRight, RefreshCw, SlidersHorizontal,
  MoreHorizontal
} from "lucide-react";

import api from "../services/api";
import ItemFormModal from "../components/ItemFormModal";
import ChangeStockModal from "../components/ChangeStockModal";
import HistoryModal from "../components/HistoryModal";

const PAGE_SIZE = 10;

const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sort, setSort] = useState({ key: "name", dir: 1 });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canEdit = user.role === "Admin" || user.role === "Manager";

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/items");

      setItems(
        data.map((i) => ({
          ...i,
          value: Number(i.quantity) * Number(i.price),
        }))
      );
    } catch {
      setError("Could not load inventory items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function saved(message) {
    setModal(null);
    setToast(message);
    loadItems();

    setTimeout(() => setToast(""), 3000);
  }

  const totalValue = items.reduce((sum, i) => sum + i.value, 0);
  const lowCount = items.filter((i) => i.is_low_stock).length;

  const rawCount = items.filter(
    (i) => i.item_type?.toUpperCase() === "RAW"
  ).length;

  const finishedCount = items.filter(
    (i) => i.item_type?.toUpperCase() === "FINISHED"
  ).length;

  const filtered = useMemo(() => {
    let list = items.filter((i) => {
      const matchesSearch = i.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesType =
        typeFilter === "ALL" ||
        i.item_type?.toUpperCase() === typeFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "LOW" && i.is_low_stock) ||
        (statusFilter === "AVAILABLE" && !i.is_low_stock);

      return matchesSearch && matchesType && matchesStatus;
    });

    return list.sort((a, b) => {
      const first = a[sort.key];
      const second = b[sort.key];

      if (first == null || second == null) return 0;

      if (typeof first === "string") {
        return first.localeCompare(second) * sort.dir;
      }

      return (first - second) * sort.dir;
    });
  }, [items, search, typeFilter, statusFilter, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const pageRows = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  function sortBy(key) {
    setSort((s) => ({
      key,
      dir: s.key === key ? -s.dir : 1,
    }));
  }

  const Th = ({ k, children, right = false }) => (
    <th
      onClick={() => k && sortBy(k)}
      className={`px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap ${
        right ? "text-right" : "text-left"
      } ${k ? "cursor-pointer hover:text-teal-700" : ""}`}
    >
      {children}
      {k && sort.key === k && (
        <span className="ml-1 text-teal-600">
          {sort.dir === 1 ? "↑" : "↓"}
        </span>
      )}
    </th>
  );

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    bg,
    subtitle,
  }) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">
            {value}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${bg}`}>
          <Icon size={23} className={color} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your stock, raw materials and finished goods.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setModal({ type: "add" })}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-95"
          >
            <Plus size={18} />
            Add Item
          </button>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Items"
          value={items.length}
          icon={Package}
          color="text-cyan-600"
          bg="bg-cyan-50"
          subtitle="All inventory records"
        />

        <StatCard
          title="Raw Materials"
          value={rawCount}
          icon={Boxes}
          color="text-amber-600"
          bg="bg-amber-50"
          subtitle="Materials available"
        />

        <StatCard
          title="Finished Goods"
          value={finishedCount}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50"
          subtitle="Completed products"
        />

        <StatCard
          title="Total Stock Value"
          value={money(totalValue)}
          icon={IndianRupee}
          color="text-orange-500"
          bg="bg-orange-50"
          subtitle="Current inventory valuation"
        />

      </div>

      {/* LOW STOCK ALERT */}
      {lowCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Low stock alert
            </p>
            <p className="text-xs text-amber-700">
              {lowCount} {lowCount === 1 ? "item is" : "items are"} running low. Consider restocking soon.
            </p>
          </div>
        </div>
      )}

      {/* TABLE CONTAINER */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* TABLE TOOLBAR */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-sm">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search inventory..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3">
              <SlidersHorizontal size={15} className="text-slate-500" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-sm text-slate-600 outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="RAW">Raw Materials</option>
                <option value="FINISHED">Finished Goods</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-teal-500"
            >
              <option value="ALL">All Status</option>
              <option value="AVAILABLE">In Stock</option>
              <option value="LOW">Low Stock</option>
            </select>

            <button
              onClick={loadItems}
              title="Refresh inventory"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"
            >
              <RefreshCw size={16} />
            </button>

          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="m-4 flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              onClick={loadItems}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING SKELETON */}
        {loading && (
          <div className="space-y-4 p-5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex animate-pulse items-center gap-5">
                <div className="h-4 w-8 rounded bg-slate-100" />
                <div className="h-4 flex-1 rounded bg-slate-100" />
                <div className="h-4 w-20 rounded bg-slate-100" />
                <div className="h-4 w-20 rounded bg-slate-100" />
                <div className="h-4 w-16 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-teal-50">
              <Package size={30} className="text-teal-600" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-800">
              No inventory items found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>

            {search || typeFilter !== "ALL" || statusFilter !== "ALL" ? (
              <button
                onClick={() => {
                  setSearch("");
                  setTypeFilter("ALL");
                  setStatusFilter("ALL");
                  setPage(1);
                }}
                className="mt-4 text-sm font-semibold text-teal-700 hover:underline"
              >
                Clear filters
              </button>
            ) : canEdit ? (
              <button
                onClick={() => setModal({ type: "add" })}
                className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Add your first item
              </button>
            ) : null}
          </div>
        )}

        {/* INVENTORY TABLE */}
        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">

                <thead className="bg-slate-50/80">
                  <tr>
                    <Th>#</Th>
                    <Th k="name">Item Name</Th>
                    <Th k="item_type">Type</Th>
                    <Th k="quantity" right>Quantity</Th>
                    <Th>Unit</Th>
                    <Th k="price" right>Unit Price</Th>
                    <Th k="value" right>Total Value</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {pageRows.map((i, index) => (
                    <tr
                      key={i.id}
                      className={`transition-colors hover:bg-teal-50/50 ${
                        i.is_low_stock ? "bg-red-50/30" : "bg-white"
                      }`}
                    >

                      <td className="px-5 py-4 text-slate-400">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          {i.is_low_stock && (
                            <AlertTriangle
                              size={15}
                              className="shrink-0 text-red-500"
                            />
                          )}
                          {i.name}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            i.item_type?.toUpperCase() === "RAW"
                              ? "bg-cyan-100 text-cyan-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {i.item_type?.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right font-medium tabular-nums text-slate-700">
                        {Number(i.quantity).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {i.unit}
                      </td>

                      <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                        {money(i.price)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-800">
                        {money(i.value)}
                      </td>

                      <td className="px-5 py-4">
                        {i.is_low_stock ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* ROW ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">

                          <button
                            onClick={() => setModal({ type: "stock", item: i })}
                            title="Change stock"
                            aria-label={`Change stock for ${i.name}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-teal-600 transition hover:bg-teal-50"
                          >
                            <Boxes size={16} />
                          </button>

                          <button
                            onClick={() => setModal({ type: "history", item: i })}
                            title="View history"
                            aria-label={`View history for ${i.name}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                          >
                            <History size={16} />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => setModal({ type: "edit", item: i })}
                              title="Edit item"
                              aria-label={`Edit ${i.name}`}
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                            >
                              <Pencil size={15} />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">

              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filtered.length}
                </span>{" "}
                items
              </p>

              <div className="flex items-center gap-2">

                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ArrowLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1
                  )
                  .map((p, index, arr) => (
                    <span key={p} className="flex items-center gap-2">
                      {index > 0 && arr[index - 1] !== p - 1 && (
                        <span className="text-slate-400">...</span>
                      )}

                      <button
                        onClick={() => setPage(p)}
                        className={`h-9 min-w-9 rounded-lg px-2 text-sm font-medium transition ${
                          page === p
                            ? "bg-teal-600 text-white shadow-sm"
                            : "border border-slate-200 text-slate-600 hover:bg-teal-50"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ArrowRight size={16} />
                </button>

              </div>
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      {modal?.type === "add" && (
        <ItemFormModal
          onClose={() => setModal(null)}
          onSaved={saved}
        />
      )}

      {modal?.type === "edit" && (
        <ItemFormModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={saved}
        />
      )}

      {modal?.type === "stock" && (
        <ChangeStockModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={saved}
        />
      )}

      {modal?.type === "history" && (
        <HistoryModal
          item={modal.item}
          onClose={() => setModal(null)}
        />
      )}

    </div>
  );
}
