const COLORS = {
  // invoice
  "Pending": "bg-blue-100 text-blue-800",
  "Created": "bg-green-100 text-green-800",
  // goods
  "Not Dispatched": "bg-red-100 text-red-800",
  "Partially Dispatched": "bg-orange-100 text-orange-800",
  "Dispatched": "bg-green-100 text-green-800",
  // production (used later)
  "PLANNED": "bg-blue-100 text-blue-800",
  "PENDING": "bg-red-100 text-red-800",
  "WIP": "bg-yellow-100 text-yellow-800",
  "IN-TESTING": "bg-gray-200 text-gray-800",
  "COMPLETED": "bg-green-100 text-green-800",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${COLORS[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}