import { useEffect, useState } from "react";
import Modal from "./Modal";
import api from "../services/api";

export default function HistoryModal({ item, onClose }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/items/${item.id}/history`)
      .then((res) => setRows(res.data))
      .catch(() => setError("Could not load history."));
  }, [item.id]);

  return (
    <Modal title={`Stock history: ${item.name}`} onClose={onClose} wide>
      {error && <p className="text-red-600">{error}</p>}
      {!rows && !error && <p className="text-slate-500">Loading...</p>}
      {rows && rows.length === 0 && <p className="text-slate-500">No history yet.</p>}
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Date</th><th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Change</th><th className="px-3 py-2">Balance</th>
                <th className="px-3 py-2">Reason</th><th className="px-3 py-2">By</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2">{r.changed_via}</td>
                  <td className={`px-3 py-2 font-medium ${r.change_qty > 0 ? "text-green-600" : "text-red-600"}`}>
                    {r.change_qty > 0 ? "+" : ""}{r.change_qty}
                  </td>
                  <td className="px-3 py-2">{r.balance_after}</td>
                  <td className="px-3 py-2">{r.reason}</td>
                  <td className="px-3 py-2">{r.changed_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}