import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";

const money = (n) => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [qtys, setQtys] = useState({});
  const [confirm, setConfirm] = useState(null); // "invoice" or "goods"
  const [saving, setSaving] = useState(false);
  const requestId = useRef(crypto.randomUUID()); // same id on retry = no double stock change

  const load = useCallback(async () => {
    try {
      const [o, t] = await Promise.all([api.get(`/orders/${id}`), api.get(`/orders/${id}/timeline`)]);
      setOrder(o.data);
      setTimeline(t.data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load order.");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!order) return <p className="text-slate-500">{error || "Loading order..."}</p>;

  const isSales = order.order_type === "SALES";
  const verb = isSales ? "Dispatch" : "Receive";
  const done = isSales ? "Dispatched" : "Received";
  const toSend = order.lines
    .filter((l) => Number(qtys[l.id]) > 0)
    .map((l) => ({ line: l, qty: Number(qtys[l.id]) }));

  function reviewGoods() {
    setError("");
    for (const { line, qty } of toSend) {
      if (qty > line.quantity - line.fulfilled_qty) {
        return setError(`Only ${line.quantity - line.fulfilled_qty} ${line.unit} of ${line.item_name} left to ${verb.toLowerCase()}`);
      }
    }
    if (toSend.length === 0) return setError(`Enter a quantity to ${verb.toLowerCase()}`);
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
      setError(err.response?.data?.error || "Cannot reach the server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/orders" className="text-sm text-teal-700 hover:underline">← Back to orders</Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800">
          {isSales ? "Sales" : "Purchase"} order #{order.id}
        </h1>
        <StatusBadge status={order.invoice_status} />
        <StatusBadge status={order.goods_status} />
      </div>
      <p className="text-slate-600">
        {order.party_name} · Ordered {order.order_date} · Due {order.due_date || "-"} · Total <b>{money(order.total_amount)}</b>
      </p>

      {toast && <div className="bg-green-50 text-green-700 p-3 rounded">{toast}</div>}
      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-3">Item</th><th className="px-4 py-3">Ordered</th>
              <th className="px-4 py-3">{done} so far</th><th className="px-4 py-3">Remaining</th>
              <th className="px-4 py-3">{verb} now</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l) => {
              const remaining = l.quantity - l.fulfilled_qty;
              return (
                <tr key={l.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{l.item_name}</td>
                  <td className="px-4 py-3">{l.quantity} {l.unit}</td>
                  <td className="px-4 py-3">{l.fulfilled_qty}</td>
                  <td className="px-4 py-3">{remaining}</td>
                  <td className="px-4 py-3">
                    {remaining > 0 ? (
                      <input value={qtys[l.id] || ""} onChange={(e) => setQtys({ ...qtys, [l.id]: e.target.value })}
                        className="w-24 border rounded px-2 py-1" placeholder="0" />
                    ) : "✓"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        {order.invoice_status === "Pending" && (
          <button onClick={() => setConfirm("invoice")} className="px-4 py-2 border border-teal-600 text-teal-700 rounded-lg">
            Create invoice
          </button>
        )}
        {order.goods_status !== "Dispatched" && (
          <button onClick={reviewGoods} className="px-4 py-2 bg-teal-600 text-white rounded-lg">
            {verb} goods
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-bold text-slate-800 mb-3">Timeline</h2>
        <ul className="space-y-3">
          {timeline.map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-green-600">✔</span>
              <div>
                <p className="font-medium">{t.event} {t.details && <span className="font-normal text-slate-600">— {t.details}</span>}</p>
                <p className="text-xs text-slate-500">{new Date(t.date).toLocaleString("en-IN")}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {confirm && (
        <Modal title="Please confirm" onClose={() => setConfirm(null)}>
          {confirm === "invoice" ? (
            <p>Create the invoice for order #{order.id}? This cannot be undone.</p>
          ) : (
            <div>
              <p className="mb-2">{verb} these items? Stock will go {isSales ? "down" : "up"}.</p>
              <ul className="list-disc pl-5 mb-2">
                {toSend.map(({ line, qty }) => <li key={line.id}>{qty} {line.unit} of {line.item_name}</li>)}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setConfirm(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-60"
              onClick={() =>
                confirm === "invoice"
                  ? run({ invoice_status: "Created" }, "Invoice created")
                  : run({ dispatch: toSend.map(({ line, qty }) => ({ order_item_id: line.id, qty })), request_id: requestId.current },
                        `Goods ${done.toLowerCase()}`)
              }>
              {saving ? "Saving..." : "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}