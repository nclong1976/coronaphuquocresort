import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { Send, MessageCircle, ArrowLeft, Trash2, Eye, EyeOff } from 'lucide-react';

interface SupportChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

function SupportChatInput({ onSend, disabled }: SupportChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="p-4 border-t border-slate-800 flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 px-4 py-2 bg-slate-800 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={disabled}
        className="p-2 bg-amber-600 rounded-lg disabled:opacity-50 hover:bg-amber-700 active:scale-95 transition-all shrink-0 flex items-center justify-center"
      >
        <Send size={20} />
      </button>
    </div>
  );
}

export function SupportChatPage() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  const { data: ticketsData } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => adminApi.tickets(),
  });

  const { data: meData } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: () => adminApi.me(),
  });
  const isSuperAdmin = meData?.user?.role === 'super_admin';

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ cuộc hội thoại này? Hành động này không thể hoàn tác.')) return;
    try {
      await adminApi.deleteTicket(ticketId);
      setSelectedTicket(null);
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    } catch (err) {
      alert('Lỗi khi xóa cuộc hội thoại: ' + (err as Error).message);
    }
  };

  const handleToggleHideTicket = async (ticketId: string, currentHidden: boolean) => {
    const actionText = currentHidden ? 'hiện' : 'ẩn';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} cuộc hội thoại này khỏi danh sách của các admin thường?`)) return;
    try {
      const res = await adminApi.toggleHideTicket(ticketId, !currentHidden);
      if (res.ticketId) {
        setSelectedTicket(res.ticketId);
      }
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    } catch (err) {
      alert(`Lỗi khi ${actionText} cuộc hội thoại: ` + (err as Error).message);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;
    try {
      await adminApi.deleteMessage(messageId);
      // Update query cache instantly
      queryClient.setQueryData(['support-tickets'], (old: any) => {
        if (!old || !old.tickets) return old;
        return {
          ...old,
          tickets: old.tickets.map((t: any) => {
            if (t.id !== selectedTicket) return t;
            return {
              ...t,
              messages: (t.messages || []).filter((msg: any) => msg.id !== messageId),
            };
          }),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    } catch (err) {
      alert('Lỗi khi xóa tin nhắn: ' + (err as Error).message);
    }
  };

  const tickets = ticketsData?.tickets || [];
  // Standard admins must not see hidden tickets
  const visibleTickets = isSuperAdmin ? tickets : tickets.filter((t: any) => !t.isHidden);
  const ticket = visibleTickets.find((t) => t.id === selectedTicket) || visibleTickets[0];

  useEffect(() => {
    if (!selectedTicket && visibleTickets[0]) setSelectedTicket(visibleTickets[0].id);
  }, [visibleTickets, selectedTicket]);

  // Sync messages from React Query cache while preserving pending optimistic messages and socket messages not yet in DB
  useEffect(() => {
    if (ticket) {
      const serverMsgs = ticket.messages || [];
      setLocalMessages((prev) => {
        const merged = [...serverMsgs];
        for (const pm of prev) {
          // If the message is in prev but not in serverMsgs, keep it to prevent race conditions with async DB writes.
          const exists = merged.some((sm) => {
            if (sm.id === pm.id) return true;
            if (String(pm.id).startsWith('tmp_') && sm.content === pm.content && sm.senderRole === pm.senderRole) {
              return true;
            }
            return false;
          });
          if (!exists) {
            // Only keep if it is a pending message OR very recently received (within 15s) to handle write lag
            const isTmp = String(pm.id).startsWith('tmp_');
            const isRecent = new Date(pm.createdAt).getTime() > Date.now() - 15000;
            if (isTmp || isRecent) {
              merged.push(pm);
            }
          }
        }
        return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    } else {
      setLocalMessages([]);
    }
  }, [ticket?.messages]);

  // Mark selected ticket as read
  useEffect(() => {
    if (selectedTicket) {
      adminApi.markTicketAsRead(selectedTicket)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
        })
        .catch(() => {});
    }
  }, [selectedTicket, ticket?.messages?.length, queryClient]);

  // Listen for socket messages in real-time
  useEffect(() => {
    if (!socket) return;
    const onMsg = (payload: any) => {
      // 1. Instantly update the React Query cache
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

      // 2. Perform a background invalidation to ensure eventual DB consistency
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      
      // 3. Update local messages state instantly
      if (selectedTicket && payload.ticketId === selectedTicket) {
        setLocalMessages((prev) => {
          if (payload.tempId && prev.some((m) => m.id === payload.tempId)) {
            return prev.map((m) => m.id === payload.tempId ? payload.message : m);
          }
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
      }
    };
    const onRead = () => {
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
      if (selectedTicket === payload.ticketId) {
        setSelectedTicket(null);
      }
    };

    const onTicketHiddenChanged = (payload: { ticketId: string; isHidden: boolean }) => {
      queryClient.setQueryData(['support-tickets'], (old: any) => {
        if (!old || !old.tickets) return old;
        return {
          ...old,
          tickets: old.tickets.map((t: any) => {
            if (t.id !== payload.ticketId) return t;
            return { ...t, isHidden: payload.isHidden };
          }),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });

      // If standard admin and ticket was hidden, and they are viewing it, close it
      if (!isSuperAdmin && payload.isHidden && selectedTicket === payload.ticketId) {
        setSelectedTicket(null);
      }
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
      if (selectedTicket === payload.ticketId) {
        setLocalMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      }
    };

    const onTicketCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    };

    socket.on('support_message', onMsg);
    socket.on('support_messages_read', onRead);
    socket.on('support_ticket_deleted', onTicketDeleted);
    socket.on('support_message_deleted', onMsgDeleted);
    socket.on('support_ticket_hidden_changed', onTicketHiddenChanged);
    socket.on('support_ticket_created', onTicketCreated);
    return () => {
      socket.off('support_message', onMsg);
      socket.off('support_messages_read', onRead);
      socket.off('support_ticket_deleted', onTicketDeleted);
      socket.off('support_message_deleted', onMsgDeleted);
      socket.off('support_ticket_hidden_changed', onTicketHiddenChanged);
      socket.off('support_ticket_created', onTicketCreated);
    };
  }, [socket, selectedTicket, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleSend = async (content: string) => {
    if (!selectedTicket) return;

    const tempId = `tmp_${Date.now()}`;
    const newMsg = {
      id: tempId,
      content,
      senderRole: 'admin',
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    setLocalMessages((prev) => [...prev, newMsg]);

    try {
      if (socket && socket.connected) {
        socket.emit('support_message', {
          ticketId: selectedTicket,
          content,
          tempId,
        });
      } else {
        const res = await adminApi.sendMessage(selectedTicket, content);
        setLocalMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.message : m))
        );
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      }
    } catch (err) {
      setLocalMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert('Không thể gửi tin nhắn: ' + (err as Error).message);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold">Live Customer Support</h2>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-12rem)] md:h-[600px]">
        {/* Conversations List - Hidden on mobile if a ticket is selected */}
        <div
          className={`w-full md:w-80 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col ${
            selectedTicket ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-slate-800 font-semibold">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            {visibleTickets.map((t) => (
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

        {/* Active Chat Pane - Hidden on mobile if no ticket is selected */}
        <div
          className={`flex-1 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden ${
            !selectedTicket ? 'hidden md:flex' : 'flex'
          }`}
        >
          {ticket ? (
            <>
              <div className="p-4 border-b border-slate-800 flex items-center">
                {/* Back button for mobile */}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 -ml-2 mr-2 text-slate-400 hover:text-white md:hidden shrink-0"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="min-w-0">
                  <p className="font-bold truncate">{ticket.user?.username}</p>
                  <p className="text-sm text-slate-400 truncate">{ticket.user?.email}</p>
                </div>
                {isSuperAdmin && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => handleToggleHideTicket(ticket.id, !!ticket.isHidden)}
                      className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 ${
                        ticket.isHidden
                          ? 'bg-violet-950/40 text-violet-400 border-violet-500/30 hover:bg-violet-900/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={ticket.isHidden ? 'Hiện cuộc hội thoại' : 'Ẩn cuộc hội thoại (Bóng ma)'}
                    >
                      {ticket.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                      <span className="hidden sm:inline">
                        {ticket.isHidden ? 'Đang ẩn' : 'Ẩn hội thoại'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteTicket(ticket.id)}
                      className="p-2 bg-red-950/40 text-red-500 hover:bg-red-900/30 rounded-lg border border-red-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
                      title="Xóa cuộc hội thoại"
                    >
                      <Trash2 size={16} />
                      <span className="hidden sm:inline">Xóa hội thoại</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {localMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2 ${
                      m.senderRole === 'admin' ? 'justify-end flex-row-reverse' : 'justify-start flex-row'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-lg ${
                        m.senderRole === 'admin' ? 'bg-amber-600/30' : 'bg-slate-800'
                      }`}
                    >
                      <p className="text-sm break-words">{m.content}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center justify-end gap-1">
                        <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                        {m.senderRole === 'admin' && (
                          <span className={m.readAt ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                            • {m.readAt ? 'Đã xem' : 'Đã gửi'}
                          </span>
                        )}
                      </p>
                    </div>
                    {isSuperAdmin && !String(m.id).startsWith('tmp_') && (
                      <button
                        onClick={() => handleDeleteMessage(m.id)}
                        className="p-1.5 text-slate-500 hover:text-red-500 rounded hover:bg-slate-800 transition-all shrink-0 self-center"
                        title="Xóa tin nhắn"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <SupportChatInput
                onSend={handleSend}
                disabled={false}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}
