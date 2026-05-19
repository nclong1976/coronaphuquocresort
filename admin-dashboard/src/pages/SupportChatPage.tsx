import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { Send, MessageCircle } from 'lucide-react';

export function SupportChatPage() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const { data: ticketsData } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => adminApi.tickets(),
  });

  const sendMutation = useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) => adminApi.sendMessage(ticketId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support-tickets'] }),
  });

  const tickets = ticketsData?.tickets || [];
  const ticket = tickets.find((t) => t.id === selectedTicket) || tickets[0];

  useEffect(() => {
    if (!selectedTicket && tickets[0]) setSelectedTicket(tickets[0].id);
  }, [tickets, selectedTicket]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = () => queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    socket.on('support_message', onMsg);
    return () => {
      socket.off('support_message', onMsg);
    };
  }, [socket, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSend = () => {
    if (!message.trim() || !ticket) return;
    sendMutation.mutate({ ticketId: ticket.id, content: message });
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Live Customer Support</h2>

      <div className="flex gap-4 h-[600px]">
        <div className="w-80 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 font-semibold">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicket(t.id)}
                className={`w-full p-4 text-left border-b border-slate-800 hover:bg-slate-800/50 ${
                  selectedTicket === t.id ? 'bg-amber-600/20' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} />
                  <span className="font-medium">{t.user?.username || 'User'}</span>
                </div>
                <p className="text-sm text-slate-500 truncate">{t.subject || 'Support'}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          {ticket ? (
            <>
              <div className="p-4 border-b border-slate-800">
                <p className="font-bold">{ticket.user?.username}</p>
                <p className="text-sm text-slate-400">{ticket.user?.email}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {ticket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg ${
                        m.senderRole === 'admin' ? 'bg-amber-600/30' : 'bg-slate-800'
                      }`}
                    >
                      <p className="text-sm">{m.content}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-slate-800 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button onClick={handleSend} className="p-2 bg-amber-600 rounded-lg">
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}
