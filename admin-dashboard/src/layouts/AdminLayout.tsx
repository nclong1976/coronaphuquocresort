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
import { logout, adminApi } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  const { socket, connected } = useSocket();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isCasinoPayoutPage = location.pathname === '/games';

  const queryClient = useQueryClient();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const { data: ticketsData } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => adminApi.tickets(),
    refetchInterval: 10000,
  });

  const tickets = ticketsData?.tickets || [];
  const unreadCount = tickets.filter((tk: any) => {
    const msgs = tk.messages || [];
    const last = msgs[msgs.length - 1];
    return last && last.senderRole === 'user' && tk.status !== 'closed';
  }).length;

  React.useEffect(() => {
    if (!socket) return;
    const onMsg = (payload: any) => {
      // Instantly update the React Query cache for sidebar unread counts
      queryClient.setQueryData(['support-tickets'], (old: any) => {
        if (!old || !old.tickets) return old;
        return {
          ...old,
          tickets: old.tickets.map((t: any) => {
            if (t.id !== payload.ticketId) return t;
            const msgs = t.messages || [];
            let updatedMsgs = [...msgs];
            let replaced = false;
            if (payload.tempId) {
              updatedMsgs = updatedMsgs.map((m) => {
                if (m.id === payload.tempId) {
                  replaced = true;
                  return { ...m, ...payload.message };
                }
                return m;
              });
            }
            if (!replaced && !updatedMsgs.some((m) => m.id === payload.message.id)) {
              updatedMsgs.push(payload.message);
            }
            return {
              ...t,
              updatedAt: payload.message.createdAt,
              messages: updatedMsgs,
            };
          }),
        };
      });

      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    };

    const onTicketDeleted = (payload: { ticketId: string }) => {
      queryClient.setQueryData(['support-tickets'], (old: any) => {
        if (!old || !old.tickets) return old;
        return {
          ...old,
          tickets: old.tickets.filter((t: any) => t.id !== payload.ticketId),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    };

    const onMsgDeleted = (payload: { ticketId: string; messageId: string }) => {
      queryClient.setQueryData(['support-tickets'], (old: any) => {
        if (!old || !old.tickets) return old;
        return {
          ...old,
          tickets: old.tickets.map((t: any) => {
            if (t.id !== payload.ticketId) return t;
            return {
              ...t,
              messages: (t.messages || []).filter((m: any) => m.id !== payload.messageId),
            };
          }),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    };

    socket.on('support_message', onMsg);
    socket.on('support_messages_read', onMsg);
    socket.on('support_ticket_deleted', onTicketDeleted);
    socket.on('support_message_deleted', onMsgDeleted);
    return () => {
      socket.off('support_message', onMsg);
      socket.off('support_messages_read', onMsg);
      socket.off('support_ticket_deleted', onTicketDeleted);
      socket.off('support_message_deleted', onMsgDeleted);
    };
  }, [socket, queryClient]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Mobile Drawer Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop and Mobile Overlay Drawer */}
      <aside
        className={`${
          sidebarOpen ? 'md:w-64' : 'md:w-20'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 left-0 z-50 w-64 md:static md:translate-x-0 transition-transform duration-300`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <span className="font-bold text-amber-500">
            {sidebarOpen || mobileOpen ? 'Casino Admin' : 'CA'}
          </span>
          {/* Mobile close button */}
          <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-slate-800 rounded md:hidden text-slate-400">
            <X size={20} />
          </button>
          {/* Desktop toggle button */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded hidden md:block text-slate-400">
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
              {(sidebarOpen || mobileOpen) && <span>{item.label}</span>}
              {item.label === 'Support' && unreadCount > 0 && (
                <span className="ml-auto bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-red-900/20 text-red-400"
          >
            <LogOut size={20} />
            {(sidebarOpen || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-14 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center min-w-0">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 mr-2 hover:bg-slate-800 rounded text-slate-300 hover:text-white md:hidden shrink-0"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base md:text-lg font-semibold truncate">
              {isCasinoPayoutPage ? 'Casino — Payout Control' : 'Admin Control Panel'}
            </h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className={`flex items-center gap-2 text-sm ${connected ? 'text-green-500' : 'text-red-500'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </header>
        <div className={`flex-1 overflow-auto ${isCasinoPayoutPage ? 'p-0' : 'p-4 md:p-6'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
