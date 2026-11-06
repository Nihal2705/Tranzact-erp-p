export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return <h1 className="p-8 text-2xl font-bold">Welcome, {user.name} ({user.role})</h1>;
}