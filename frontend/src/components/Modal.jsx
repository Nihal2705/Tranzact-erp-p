export default function Modal({ title, onClose, wide, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-lg w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-700">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}