import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const PAGE_SIZE = 10;
const money = (n) => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: 1 });
  const [page, setPage] = useState(1);

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/items");
      setItems(data.map((i) => ({ ...i, value: i.quantity * i.price })));
    } catch {
      setError("Could not load items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadItems(); }, []);

  const filtered = useMemo(() => {
    const list = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : -1) * sort.dir);
  }, [items, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalValue = items.reduce((sum, i) => sum + i.value, 0);
  const lowCount = items.filter((i) => i.is_low_stock).length;

  function sortBy(key) {
    setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }));
  }

  const Th = ({ k, children }) => (
    <th onClick={() => k && sortBy(k)} className={`px-4 py-3 text-left ${k ? "cursor-pointer hover:text-teal-700" : ""}`}>
      {children} {sort.key === k && (sort.dir === 1 ? "▲" : "▼")}
    </th>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-slate-500">Total Stock Valuation</p>
          <p className="text-2xl font-bold text-teal-700">{money(totalValue)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-slate-500">Low-stock items</p>
          <p className={`text-2xl font-bold ${lowCount ? "text-red-600" : "text-slate-800"}`}>{lowCount}</p>
        </div>
      </div>

      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search items..." className="w-full sm:w-72 border rounded-lg px-3 py-2 bg-white" />

      {loading && <p className="text-slate-500">Loading items...</p>}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded flex justify-between">
          {error} <button onClick={loadItems} className="underline">Retry</button>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && <p className="text-slate-500">No items found.</p>}

      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th k="name">Item</Th><Th k="item_type">Type</Th><Th k="quantity">Stock</Th>
                <Th>Unit</Th><Th k="price">Price</Th><Th k="value">Value</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((i) => (
                <tr key={i.id} className={`border-t ${i.is_low_stock ? "bg-red-50" : ""}`}>
                  <td className="px-4 py-3 font-medium">{i.is_low_stock && "⚠️ "}{i.name}</td>
                  <td className="px-4 py-3">{i.item_type}</td>
                  <td className="px-4 py-3">{i.quantity}</td>
                  <td className="px-4 py-3">{i.unit}</td>
                  <td className="px-4 py-3">{money(i.price)}</td>
                  <td className="px-4 py-3">{money(i.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center px-4 py-3 border-t text-sm">
            <span>Page {page} of {totalPages}</span>
            <div className="space-x-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Previous</button>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}