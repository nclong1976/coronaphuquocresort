import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { Users, Wallet, TrendingUp, Gamepad2, CreditCard, Landmark } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useSocket } from '../hooks/useSocket';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

export function DashboardPage() {
  const { socket } = useSocket();
  const { data: stats, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats(),
    refetchInterval: 10000,
  });

  React.useEffect(() => {
    if (!socket) return;
    const onEvent = () => refetch();
    socket.on('bet_placed', onEvent);
    socket.on('deposit_request', onEvent);
    socket.on('withdraw_request', onEvent);
    return () => {
      socket.off('bet_placed', onEvent);
      socket.off('deposit_request', onEvent);
      socket.off('withdraw_request', onEvent);
    };
  }, [socket, refetch]);

  if (!stats) return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-500' },
    { label: 'Total Bets', value: stats.bets.toLocaleString(), icon: Gamepad2, color: 'text-amber-500' },
    { label: 'Today Bets', value: `$${stats.todayBets.toLocaleString()}`, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Today Payouts', value: `$${stats.todayPayouts.toLocaleString()}`, icon: Wallet, color: 'text-purple-500' },
    { label: 'Today Profit', value: `$${stats.todayProfit.toLocaleString()}`, icon: CreditCard, color: 'text-emerald-500' },
    { label: 'Total Deposits', value: `$${stats.totalDeposits.toLocaleString()}`, icon: Landmark, color: 'text-cyan-500' },
  ];

  const gameData = (stats.betByGame || []).map((g) => ({ name: g.game, value: g.totalBet }));

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    bets: Math.floor(Math.random() * 5000) + 1000,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Overview Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <card.icon size={32} className={card.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-semibold mb-4">Bet Volume (Hourly)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Area type="monotone" dataKey="bets" stroke="#f59e0b" fill="#f59e0b20" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-semibold mb-4">Game Popularity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gameData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {gameData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="font-semibold mb-4">Bet by Game</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gameData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" width={70} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
