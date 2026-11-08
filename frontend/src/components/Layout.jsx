import Logo from './Logo';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Boxes, ShoppingCart, Factory, BarChart3,
  LogOut, Search, Bell, Menu, X,
} from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/production', label: 'Production', icon: Factory },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Layout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  let user = {};
  try { user = JSON.parse(localStorage.getItem('user')) || {}; } catch {}
  const initials = (user.name || 'U').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-gradient-to-b from-teal-700 to-teal-950 text-teal-50">
      <div className="flex items-center gap-3 px-5 py-6">
       <Logo size={34} />
        <span className="text-lg font-bold">TranZact ERP</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-teal-400/20 text-white shadow-inner' : 'text-teal-100/80 hover:bg-white/10'
              }`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-teal-400 text-sm font-bold text-teal-950">{initials}</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{user.name || 'User'}</div>
            <div className="text-xs text-teal-200/80">{user.role}</div>
          </div>
        </div>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-teal-100/80 hover:bg-white/10">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64">
            {sidebar}
            <button onClick={() => setOpen(false)} className="absolute right-3 top-5 text-white"><X size={20} /></button>
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b bg-white/80 px-4 py-3 backdrop-blur sm:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div className="relative max-w-md flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search anything..." className="h-10 w-full rounded-full border bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-teal-500" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative grid h-10 w-10 place-items-center rounded-full border bg-white text-slate-600" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}