/**
 * Chat trực tiếp trong bàn Sic Bo - nút nổi có thể kéo, Socket.io real-time, AI tương tác
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Socket } from 'socket.io-client';

const AI_NAMES = ['Lucky88', 'VipPro', 'DiceKing', 'GoldPlayer', 'HighRoller', 'CasinoFan', 'BetMaster'];
const AI_RESPONSES = [
  ['Tài nào! 🔥', 'Xỉu thôi!', 'Cược Tài đi anh em!', 'Xỉu chắc ăn!', 'Tài nào mọi người!'],
  ['Ván này Tài!', 'Xỉu đi, Xỉu đi!', 'Tôi cược Tài $500', 'Xỉu chắc thắng!', 'Tài đi!'],
  ['Dealer Marc pro quá!', 'Bàn này hot!', 'Cược đi anh em!', 'Sắp mở bát rồi!', 'Hồi hộp quá!'],
  ['Thắng lớn ván trước!', 'Tiếp Tài nào!', 'Xỉu không sai!', 'Tài đẹp!', 'Cược mạnh lên!'],
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface ChatMessage {
  id: string;
  userId?: string;
  username: string;
  content: string;
  createdAt: string;
  isAi?: boolean;
}

interface SicBoGameChatProps {
  socket: Socket | null;
  userId: string | null;
  username: string;
  isOpen?: boolean;
  phase?: string;
  lastResult?: string | null;
  onToggle?: () => void;
}

export function SicBoGameChat({
  socket,
  userId,
  username,
  isOpen = false,
  phase,
  lastResult,
  onToggle,
}: SicBoGameChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      username: 'Hệ thống',
      content: 'Chào mừng đến bàn Sic Bo! Chúc bạn may mắn! 🎲',
      createdAt: new Date().toISOString(),
      isAi: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 100 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Join/leave sicbo room
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_sicbo');
    return () => {
      socket.emit('leave_sicbo');
    };
  }, [socket]);

  // Lắng nghe tin nhắn từ Socket
  useEffect(() => {
    if (!socket) return;
    const handler = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, { ...msg, id: msg.id || `m-${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
    };
    socket.on('sicbo:chat_message', handler);
    return () => {
      socket.off('sicbo:chat_message', handler);
    };
  }, [socket]);

  // AI tự động nhắn - tạo cảm giác nhiều người
  useEffect(() => {
    if (!isOpen || !socket) return;
    const scheduleAi = () => {
      aiTimeoutRef.current = setTimeout(() => {
        const name = getRandomItem(AI_NAMES);
        const group = getRandomItem(AI_RESPONSES);
        const content = getRandomItem(group);
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          username: name,
          content,
          createdAt: new Date().toISOString(),
          isAi: true,
        };
        setMessages((prev) => [...prev, aiMsg]);
        scheduleAi();
      }, 8000 + Math.random() * 12000); // 8-20s giữa mỗi tin AI
    };
    scheduleAi();
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [isOpen, socket]);

  // AI phản hồi khi có kết quả
  useEffect(() => {
    if (!lastResult || !isOpen) return;
    const name = getRandomItem(AI_NAMES);
    const reactions =
      lastResult === 'BIG'
        ? ['Tài thắng! Đúng rồi!', 'Tài đẹp!', 'Tôi cược Tài mà!', 'Tài không sai!']
        : lastResult === 'SMALL'
          ? ['Xỉu thắng!', 'Xỉu đúng rồi!', 'Xỉu chắc ăn!', 'Tôi biết Xỉu mà!']
          : ['Bão! Hiếm quá!', 'Bão luôn!', 'Triple!'];
    const aiMsg: ChatMessage = {
      id: `ai-result-${Date.now()}`,
      username: name,
      content: getRandomItem(reactions),
      createdAt: new Date().toISOString(),
      isAi: true,
    };
    setMessages((prev) => [...prev, aiMsg]);
  }, [lastResult, isOpen]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || !socket) return;
    socket.emit('sicbo:chat', { username, content });
    setInput('');
    // Tin nhắn sẽ đến qua sicbo:chat_message từ server
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragOffset({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;
      setPosition({
        x: Math.max(0, Math.min(clientX - dragOffset.x, maxX)),
        y: Math.max(0, Math.min(clientY - dragOffset.y, maxY)),
      });
    },
    [isDragging, dragOffset]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: true });
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return (
    <>
      {/* Nút Chat nổi - có thể kéo */}
      <motion.div
        style={{ left: position.x, top: position.y }}
        className="fixed z-[80] cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
            isOpen ? 'bg-[#d4af37] text-slate-900' : 'gold-gradient text-slate-900'
          } border-2 border-[#f9e498]/50 hover:scale-110 active:scale-95`}
        >
          <MessageCircle size={24} />
        </button>
        {messages.length > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
            {messages.length > 99 ? '99+' : messages.length}
          </span>
        )}
      </motion.div>

      {/* Panel Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
              left: Math.max(8, Math.min(position.x, window.innerWidth - 288)),
              top: position.y + 56,
            }}
            className="fixed z-[81] w-72 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-xl border border-[#d4af37]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-[#d4af37]/20 border-b border-[#d4af37]/30">
              <span className="text-[#f9e498] font-bold text-sm">Chat trực tiếp</span>
              <button onClick={onToggle} className="p-1 rounded hover:bg-white/10 text-white/70">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 h-48 overflow-y-auto p-2 space-y-2 flex flex-col">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`text-sm ${m.userId === userId ? 'text-right' : 'text-left'}`}
                >
                  <span className={`text-[10px] ${m.isAi ? 'text-amber-400/80' : 'text-slate-400'}`}>
                    {m.username}
                  </span>
                  <div
                    className={`inline-block px-3 py-1.5 rounded-lg max-w-[80%] ${
                      m.userId === userId ? 'bg-[#d4af37]/30 text-[#f9e498] ml-auto' : 'bg-slate-700/80 text-slate-200'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-2 border-t border-slate-700 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-3 py-2 bg-slate-800 rounded-lg text-white text-sm outline-none placeholder:text-slate-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 gold-gradient rounded-lg text-slate-900 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
