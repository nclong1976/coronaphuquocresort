import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { Search, Ban, Shield, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminApi.users({ search: search || undefined, limit: 50 }),
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) => adminApi.banUser(userId, banned),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Management</h2>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">User</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Balance</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(data?.users || []).map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <Link to={`/users/${u.id}`} className="flex items-center gap-2 hover:text-amber-500">
                      <span className="font-medium">{u.username}</span>
                      <ChevronRight size={16} />
                    </Link>
                    <p className="text-sm text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono">${(u.balance ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${u.role === 'admin' ? 'bg-amber-600/20 text-amber-500' : 'bg-slate-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={u.isBanned ? 'text-red-500' : 'text-green-500'}>{u.isBanned ? 'Banned' : 'Active'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => banMutation.mutate({ userId: u.id, banned: !u.isBanned })}
                      className={`p-2 rounded-lg ${u.isBanned ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'} hover:opacity-80`}
                    >
                      {u.isBanned ? <Shield size={18} /> : <Ban size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
