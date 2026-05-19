import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from '../hooks/useSocket';
import { Activity, Server, Zap, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SystemPage() {
  const { connected } = useSocket();
  const [latency, setLatency] = useState<number[]>([]);
  const [startTime] = useState(Date.now());

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const start = performance.now();
      await fetch(`${API_BASE}/health`);
      return performance.now() - start;
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (health !== undefined) {
      setLatency((prev) => [...prev.slice(-59), health]);
    }
  }, [health]);

  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const mockRequestRate = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    rate: Math.floor(Math.random() * 100) + 50,
    errors: Math.floor(Math.random() * 5),
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Monitoring</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <Server className="text-amber-500" size={32} />
            <div>
              <p className="text-slate-400 text-sm">API Status</p>
              <p className={`text-xl font-bold ${health !== undefined ? 'text-green-500' : 'text-red-500'}`}>
                {health !== undefined ? 'Online' : 'Checking...'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <Zap className="text-blue-500" size={32} />
            <div>
              <p className="text-slate-400 text-sm">API Latency</p>
              <p className="text-xl font-bold">{health !== undefined ? `${Math.round(health)}ms` : '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <Activity className="text-green-500" size={32} />
            <div>
              <p className="text-slate-400 text-sm">WebSocket</p>
              <p className={`text-xl font-bold ${connected ? 'text-green-500' : 'text-red-500'}`}>
                {connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-purple-500" size={32} />
            <div>
              <p className="text-slate-400 text-sm">Uptime</p>
              <p className="text-xl font-bold">{Math.floor(uptime / 3600)}h {Math.floor((uptime % 3600) / 60)}m</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="font-semibold mb-4">API Latency (Last 60 checks)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={latency.map((v, i) => ({ i, ms: v }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="i" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              <Line type="monotone" dataKey="ms" stroke="#f59e0b" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-semibold mb-4">Request Rate (Mock)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRequestRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="rate" stroke="#10b981" name="Requests/min" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-semibold mb-4">Error Rate (Mock)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRequestRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="errors" stroke="#ef4444" name="Errors" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
