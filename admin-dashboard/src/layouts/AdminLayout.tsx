import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  Landmark,
  Gamepad2,
  FileText,
  MessageCircle,
  Activity,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { logout } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/financial', icon: Wallet, label: 'Financial' },
  { to: '/games', icon: Gamepad2, label: 'Casino / Tỉ lệ' },
  { to: '/deposits', icon: CreditCard, label: 'Deposits' },
  { to: '/withdrawals', icon: Landmark, label: 'Withdrawals' },
  { to: '/transactions', icon: FileText, label: 'Transactions' },
  { to: '/support', icon: MessageCircle, label: 'Support' },
  { to: '/system', icon: Activity, label: 'System' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connected } = useSocket();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const isCasinoPayoutPage = location.pathname === '/games';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          {sidebarOpen && <span className="font-bold text-amber-500">Casino Admin</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive ? 'bg-amber-600/20 text-amber-500' : 'hover:bg-slate-800 text-slate-300'
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-red-900/20 text-red-400"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">
            {isCasinoPayoutPage ? 'Casino — Payout Control (đồng bộ app người chơi)' : 'Admin Control Panel'}
          </h1>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-sm ${connected ? 'text-green-500' : 'text-red-500'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {connected ? 'Live' : 'Offline'}
            </div>
          </div>
        </header>
        <div className={`flex-1 overflow-auto ${isCasinoPayoutPage ? 'p-0' : 'p-6'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
