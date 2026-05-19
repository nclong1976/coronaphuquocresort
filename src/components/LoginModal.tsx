import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  onClose: () => void;
  onSwitchToRegister: () => void;
  onLoginSuccess?: (user: { role?: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSwitchToRegister, onLoginSuccess }) => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(emailOrUsername, password);
      onLoginSuccess?.(user ?? {});
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-8 md:p-12 flex flex-col gap-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="https://casinocorona.vn/wp-content/uploads/2024/06/logo-color-3.webp" alt="Corona Logo" className="h-12 md:h-16 object-contain mb-2" />
          <p className="text-slate-300 text-sm font-medium">TRUY CẬP KHÔNG GIAN ĐẶC QUYỀN DÀNH CHO THÀNH VIÊN</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleLogin}>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-300 ml-1">Email hoặc tên đăng nhập</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User size={20} />
              </div>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Nhập email hoặc tên đăng nhập"
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-300 ml-1">Mật khẩu</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={20} />
              </div>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button className="w-full py-4 rounded-xl text-slate-900 font-black text-base uppercase tracking-widest mt-2 bg-white hover:bg-slate-200 transition-all shadow-lg disabled:opacity-50" type="submit" disabled={loading}>
            {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-slate-300 text-sm">
            Bạn chưa có tài khoản?{' '}
            <button onClick={onSwitchToRegister} className="text-white font-bold hover:underline">Yêu cầu quyền truy cập</button>
          </p>
        </div>
      </div>
    </div>
  );
};
