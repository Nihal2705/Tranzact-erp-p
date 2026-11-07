import { NavLink, Outlet, useNavigate } from "react-router-dom";

const MENU = [
  { to: "/dashboard",  label: "Dashboard",  roles: ["Admin", "Manager"] },
  { to: "/inventory",  label: "Inventory",  roles: ["Admin", "Manager", "Worker"] },
  { to: "/orders",     label: "Orders",     roles: ["Admin", "Manager"] },
  { to: "/production", label: "Production", roles: ["Admin", "Manager", "Worker"] },
  { to: "/reports",    label: "Reports",    roles: ["Admin", "Manager"] },
];

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  function logout() {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-56 bg-teal-800 text-white flex flex-col">
        <div className="p-5 text-xl font-bold">TranZact ERP</div>
        <nav className="flex-1 px-3 space-y-1">
          {MENU.filter((m) => m.roles.includes(user.role)).map((m) => (
            <NavLink key={m.to} to={m.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg ${isActive ? "bg-teal-600" : "hover:bg-teal-700"}`}>
              {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-3 flex justify-end items-center gap-4">
          <span className="text-sm text-slate-600">{user.name} · <b>{user.role}</b></span>
          <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
        </header>
        <main className="p-6"><Outlet /></main>
      </div>
    </div>
  );
}