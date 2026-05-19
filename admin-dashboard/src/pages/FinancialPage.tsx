import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function FinancialPage() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats(),
  });

  const revenueData = [
    { name: 'Deposits', value: stats?.totalDeposits ?? 0 },
    { name: 'Withdrawals', value: stats?.totalWithdraws ?? 0 },
    { name: 'Bets', value: stats?.todayBets ?? 0 },
    { name: 'Payouts', value: stats?.todayPayouts ?? 0 },
    { name: 'Profit', value: stats?.todayProfit ?? 0 },
  ];

  const dailyData = Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    revenue: Math.floor(Math.random() * 5000),
    deposits: Math.floor(Math.random() * 3000),
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Financial Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <p className="text-slate-400 text-sm">Total Deposits</p>
          <p className="text-2xl font-bold text-green-500">${(stats?.totalDeposits ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <p className="text-slate-400 text-sm">Total Withdrawals</p>
          <p className="text-2xl font-bold text-blue-500">${(stats?.totalWithdraws ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <p className="text-slate-400 text-sm">Today Profit</p>
          <p className="text-2xl font-bold text-amber-500">${(stats?.todayProfit ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <p className="text-slate-400 text-sm">Today Deposits</p>
          <p className="text-2xl font-bold">${(stats?.todayDeposits ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-semibold mb-4">Revenue Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-semibold mb-4">Deposit vs Withdraw (Daily)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98120" />
                <Area type="monotone" dataKey="deposits" stroke="#3b82f6" fill="#3b82f620" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
