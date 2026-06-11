import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { Check, X } from 'lucide-react';

export function DepositsPage() {
  const [status, setStatus] = useState('pending');
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-deposits', status],
    queryFn: () => adminApi.deposits(status),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveDeposit(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-deposits'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectDeposit(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-deposits'] }),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;

  const deposits = data?.deposits || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Deposit Management</h2>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-lg ${status === s ? 'bg-amber-600' : 'bg-slate-800'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {deposits.length === 0 && <p className="text-slate-400">No deposits</p>}
        {deposits.map((d) => (
          <div key={d.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div>
              <p className="font-bold">{d.user?.username}</p>
              <p className="text-slate-400 text-sm">{d.user?.email}</p>
              <p className="text-amber-500 font-mono text-lg mt-1">${d.amount.toLocaleString()}</p>
              <p className="text-slate-500 text-sm">{new Date(d.createdAt).toLocaleString()}</p>
            </div>
            {d.status === 'pending' && (
              <div className="flex gap-2 w-full sm:w-auto items-center">
                <input
                  type="text"
                  placeholder="Note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="px-3 py-2 bg-slate-800 rounded-lg flex-1 sm:flex-none w-full sm:w-32 min-w-0"
                />
                <button onClick={() => approveMutation.mutate(d.id)} className="p-2 bg-green-600 rounded-lg hover:bg-green-500 shrink-0">
                  <Check size={20} />
                </button>
                <button onClick={() => rejectMutation.mutate(d.id)} className="p-2 bg-red-600 rounded-lg hover:bg-red-500 shrink-0">
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
