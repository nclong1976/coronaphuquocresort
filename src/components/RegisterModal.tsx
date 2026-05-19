import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (!termsAccepted) {
      setError('Vui lòng đồng ý với Điều khoản & Điều kiện.');
      return;
    }
    setLoading(true);
    try {
      const email = `${username}@corona.local`;
      await register(email, username, fullName, password);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-8 md:p-12 flex flex-col gap-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="https://casinocorona.vn/wp-content/uploads/2024/06/logo-color-3.webp" alt="Corona Logo" className="h-12 md:h-16 object-contain mb-2" />
          <p className="text-slate-300 text-sm font-medium">TRẢI NGHIỆM ĐẲNG CẤP THƯỢNG LƯU</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-300 ml-1">Họ và Tên</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nhập họ và tên thật" type="text" required />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-300 ml-1">Tên đăng nhập</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nhập tên người dùng" type="text" required />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-300 ml-1">Mật khẩu</label>
            <div className="relative">
              <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nhập mật khẩu" type={showPassword ? 'text' : 'password'} required />
              <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-300 ml-1">Xác nhận mật khẩu</label>
            <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Xác nhận mật khẩu" type="password" required />
          </div>
          <div className="flex items-start gap-3 mt-2">
            <input checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 size-4 mt-1" id="terms" type="checkbox" />
            <label className="text-xs text-slate-300 leading-tight cursor-pointer" htmlFor="terms">Tôi đồng ý với <span className="text-primary hover:underline">Điều khoản & Điều kiện</span> và xác nhận rằng tôi đã đủ 18 tuổi.</label>
          </div>
          <button className="w-full py-4 rounded-xl text-slate-900 font-black text-base uppercase tracking-widest mt-2 bg-white hover:bg-slate-200 transition-all shadow-lg disabled:opacity-50" type="submit" disabled={loading}>
            {loading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ NGAY'}
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-slate-300 text-sm">Đã có tài khoản? <button onClick={onSwitchToLogin} className="text-white font-bold hover:underline">Đăng nhập</button></p>
        </div>
      </div>
    </div>
  );
};
