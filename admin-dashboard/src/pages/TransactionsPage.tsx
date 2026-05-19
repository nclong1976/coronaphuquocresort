import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../services/api';

export function TransactionsPage() {
  const [type, setType] = useState('');
  const [userId, setUserId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', type, userId],
    queryFn: () => adminApi.transactions({ type: type || undefined, userId: userId || undefined, limit: 100 }),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;

  const feed = data?.feed || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Activity &amp; ledger</h2>

      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg"
        >
          <option value="">All Types</option>
          <option value="bet">Bet</option>
          <option value="win">Win</option>
          <option value="lose">Lose</option>
          <option value="deposit">Deposit</option>
          <option value="withdraw">Withdraw</option>
        </select>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Kind</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Detail</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">User / Admin</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {feed.map((row: any) =>
              row.kind === 'audit' ? (
                <tr key={`a-${row.id}`} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-violet-400 text-xs font-bold">audit</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-slate-300">{row.action}</span>
                    <p className="text-slate-500 text-xs mt-1">{row.summary}</p>
                  </td>
                  <td className="px-4 py-3">@{row.adminUsername}</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(row.createdAt).toLocaleString()}</td>
                </tr>
              ) : (
                <tr key={`l-${row.id}`} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        row.type === 'deposit' || row.type === 'win' ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{row.game || '-'}</td>
                  <td className="px-4 py-3">{row.user?.username || row.userId}</td>
                  <td className="px-4 py-3 font-mono">${Number(row.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(row.createdAt).toLocaleString()}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
