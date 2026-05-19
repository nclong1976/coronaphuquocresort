import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { ArrowLeft, Ban, Shield } from 'lucide-react';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminApi.user(id!),
    enabled: !!id,
  });

  const banMutation = useMutation({
    mutationFn: (banned: boolean) => adminApi.banUser(id!, banned),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user', id] }),
  });

  if (isLoading || !data) return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;

  const { user, transactions, loginHistory } = data;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <p className="text-slate-400">{user.email}</p>
            <p className="text-amber-500 font-mono mt-2">Balance: ${(user.balance ?? 0).toLocaleString()}</p>
          </div>
          <button
            onClick={() => banMutation.mutate(!user.isBanned)}
            className={`px-4 py-2 rounded-lg ${user.isBanned ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {user.isBanned ? <><Shield size={18} className="inline mr-2" />Unban</> : <><Ban size={18} className="inline mr-2" />Ban</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-semibold mb-4">Transaction History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.map((t) => (
              <div key={t.id} className="flex justify-between py-2 border-b border-slate-800">
                <span className={t.type === 'deposit' || t.type === 'win' ? 'text-green-500' : 'text-red-500'}>
                  {t.type} ${t.amount.toLocaleString()}
                </span>
                <span className="text-slate-500 text-sm">{new Date(t.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-semibold mb-4">Login History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loginHistory.map((l, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-800 text-sm">
                <span>{l.ip || 'Unknown'}</span>
                <span className="text-slate-500">{new Date(l.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
