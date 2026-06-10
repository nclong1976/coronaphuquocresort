import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  ChevronDown, 
  ShieldCheck, 
  Wallet, 
  X, 
  Wifi,
  WifiOff,
  Eye, 
  Shield, 
  Landmark, 
  CreditCard, 
  Bitcoin, 
  ArrowRight,
  AlertTriangle,
  Lock,
  LogOut,
  Crown,
  Key,
  HeadphonesIcon,
  MessageCircle,
  Phone,
  Bell,
  ChevronRight,
  Paperclip,
  Image as ImageIcon,
  Send,
  CheckCheck,
  User,
  Menu,
  Home,
  Dices,
  Utensils,
  Hotel,
  Gift,
  History,
} from 'lucide-react';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';

import { ThreeCardPoker } from './games/ThreeCardPoker';
import { CaribbeanStud } from './games/CaribbeanStud';
import { NiuNiu } from './games/NiuNiu';
import { XiDach } from './games/XiDach';
import { SicBo } from './games/SicBo';
import { SicBoApi } from './games/SicBoApi';
import { TexasHoldem } from './games/TexasHoldem';
import { RussianPoker } from './games/RussianPoker';
import { BaiCao } from './games/BaiCao';
import { TigerBaccarat } from './games/TigerBaccarat';
import { BaccaratLongHo } from './games/BaccaratLongHo';
import { SlotMachine } from './games/SlotMachine';
import { SlotApi } from './games/SlotApi';
import { Roulette } from './games/Roulette';
import { RouletteApi } from './games/RouletteApi';
import { HotelScreen } from './components/HotelScreen';
import { RestaurantScreen } from './components/RestaurantScreen';
import { LandingPage } from './components/LandingPage';
import { UuDaiScreen } from './components/UuDaiScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { AnimatedBalance } from './components/AnimatedBalance';
import { useAuth } from './context/AuthContext';
import { useWallet } from './context/WalletContext';
import { useVipColorsContext } from './context/VipColorsContext';
import { useUserAdapter } from './hooks/useUserAdapter';
import { useBalanceUpdate } from './hooks/useBalanceUpdate';
import { useAppSocket } from './context/SocketContext';
import { usePlayerNotifications } from './context/PlayerNotificationsContext';
import { useGameCatalog } from './hooks/useGameCatalog';
import { useStore } from './store/useStore';
import { walletApi } from './api/client';
import { Analytics } from '@vercel/analytics/react';

// --- Nội dung Trang cá nhân (super admin leo1102 được sửa) ---
const PROFILE_MESSAGE_STORAGE_KEY = 'corona_profile_poem_v1';
/** Mở khối « Lời nhắn » ẩn trên Trang cá nhân */
const PROFILE_SECRET_PASSCODE = '8283';
const DEFAULT_PROFILE_MESSAGE = `Đời qua mấy bận phong ba,
Anh qua một vợ, em qua một chồng.
Đắng cay nếm đủ trong lòng,
Mới hay gặp gỡ cũng không dễ dàng.
Từ nay dẫu gió dẫu ngàn,
Anh thương em mãi, dịu dàng đợi mai.
Mai kia nắng ấm ban mai,
Hai ta bình yên… nắm tay giữa đời.
- - Yến anh yêu em - -`;


// --- CẤU HÌNH HỆ THỐNG VIP (màu thẻ tự động từ public/bangvip.html) ---
const VIP_CONFIG = [
  { level: 0, threshold: 0, bonus: 0, colorName: 'Xám bạc' },
  { level: 1, threshold: 5000, bonus: 388, colorName: 'Xanh bạc' },
  { level: 2, threshold: 10000, bonus: 1000, colorName: 'Đồng' },
  { level: 3, threshold: 20000, bonus: 2000, colorName: 'Xanh lá' },
  { level: 4, threshold: 40000, bonus: 4000, colorName: 'Tím' },
  { level: 5, threshold: 60000, bonus: 7000, colorName: 'Đồng vàng' },
  { level: 6, threshold: 100000, bonus: 14000, colorName: 'Tím đậm' },
  { level: 7, threshold: 150000, bonus: 30000, colorName: 'Xanh lá đậm' },
  { level: 8, threshold: 200000, bonus: 45000, colorName: 'Đỏ' },
  { level: 9, threshold: 400000, bonus: 90000, colorName: 'Xanh ngọc' },
  { level: 10, threshold: 600000, bonus: 140000, colorName: 'Vàng' },
];

/** Các màn chơi trong Casino — khớp `navigate(id)` */
const CASINO_GAME_SCREEN_IDS = new Set([
  'threecard',
  'caribbean',
  'niuniu',
  'xidach',
  'xucxac',
  'texas',
  'russian',
  'baicao',
  'tigerbaccarat',
  'baccaratlongho',
  'slots',
  'roulette',
]);

// --- MÀN HÌNH 0: TRANG CHỦ (GAMES) ---
const GAMES = [
  { id: 'baicao', name: 'Bài Cào', image: 'https://casinocorona.vn/wp-content/uploads/2025/07/baccarat.jpg' },
  { id: 'tigerbaccarat', name: 'Tiger Baccarat', image: 'https://casinocorona.vn/wp-content/uploads/2025/07/tiger-bacarat.jpg' },
  { id: 'baccaratlongho', name: 'Baccarat Long Hổ', image: 'https://casinocorona.vn/wp-content/uploads/2025/08/dragon-tiger-thumn.jpg' },
  { id: 'texas', name: "Xì Tố Texas Hold 'em", image: 'https://casinocorona.vn/wp-content/uploads/2025/08/texas-holdem.jpg' },
  { id: 'threecard', name: 'Xì Tố Ba Lá', image: 'https://casinocorona.vn/wp-content/uploads/2025/07/three-card-poker.jpg' },
  { id: 'russian', name: 'Xì Tố Nga', image: 'https://casinocorona.vn/wp-content/uploads/2025/08/russian-poker.jpg' },
  { id: 'xidach', name: 'Xì Dách', image: 'https://casinocorona.vn/wp-content/uploads/2025/08/blackjack.jpg' },
  { id: 'niuniu', name: 'Niu Niu Poker', image: 'https://casinocorona.vn/wp-content/uploads/2025/08/niu-niu-poker.jpg' },
  { id: 'caribbean', name: 'Caribbean Stud Poker', image: 'https://casinocorona.vn/wp-content/uploads/2025/07/caribbean-stud-poker.jpg' },
  { id: 'xucxac', name: 'Xúc Xắc', image: 'https://casinocorona.vn/wp-content/uploads/2025/08/sic-bo.jpg' },
  { id: 'slots', name: 'Slots', image: 'https://casinocorona.vn/wp-content/uploads/2025/07/slot.jpg' },
  { id: 'roulette', name: 'Cò Quay', image: 'https://casinocorona.vn/wp-content/uploads/2025/07/roulette.jpg' },
];

function HomeScreen({
  onOpenMenu,
  onGameSelect,
  rowForCasinoScreen,
}: {
  onOpenMenu: () => void;
  onGameSelect: (id: string) => void;
  rowForCasinoScreen?: (screenId: string) => { enabled: boolean; minBet: number; maxBet: number } | null;
}) {
  return (
    <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col shadow-2xl overflow-x-hidden bg-[#0b1315] text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-black/90 backdrop-blur-md px-4 py-3 border-b border-yellow-500/20">
        <div className="flex items-center gap-3">
          <button onClick={onOpenMenu} className="text-slate-300 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
          <img 
            src="https://casinocorona.vn/wp-content/uploads/2024/06/logo-color-3.webp" 
            alt="Corona Logo" 
            className="h-8 object-contain"
          />
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative w-full h-56 shrink-0">
        <img 
          src="https://casinocorona.vn/wp-content/uploads/2022/09/CRN_3193.jpg" 
          alt="Hero" 
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1315] via-[#0b1315]/40 to-transparent"></div>
        <div className="absolute bottom-6 left-0 right-0 text-center px-4">
          <h1 className="text-2xl font-bold text-yellow-500 uppercase tracking-widest drop-shadow-lg mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
            Hệ thống trò chơi
          </h1>
          <p className="text-sm text-slate-300 uppercase tracking-widest">Tại Casino Corona</p>
        </div>
      </div>

      {/* Games Grid */}
      <div className="p-4 grid grid-cols-2 gap-4 pb-10">
        {GAMES.map((game) => {
          const row = rowForCasinoScreen?.(game.id);
          const enabled = row ? row.enabled : true;
          const limits =
            row && Number.isFinite(row.minBet) && Number.isFinite(row.maxBet)
              ? `Min $${row.minBet} · Max $${row.maxBet >= 1e6 ? row.maxBet.toLocaleString() : row.maxBet}`
              : null;
          return (
            <div
              key={game.id}
              onClick={() => {
                if (!enabled) {
                  alert('Trò chơi đang bảo trì theo cấu hình Admin.');
                  return;
                }
                onGameSelect(game.id);
              }}
              className={`bg-[#1a1f2e] rounded-xl overflow-hidden border border-yellow-500/20 shadow-[0_4px_20px_rgba(184,146,47,0.15)] group transition-all flex flex-col relative ${
                enabled ? 'hover:border-yellow-500/50 cursor-pointer' : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={game.image}
                  alt={game.name}
                  className={`w-full h-full object-cover transition-transform duration-500 ${enabled ? 'group-hover:scale-110' : ''}`}
                />
                <div
                  className={`absolute inset-0 transition-colors ${enabled ? 'bg-black/20 group-hover:bg-transparent' : 'bg-black/45'}`}
                />
                {!enabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300 px-2 py-1 rounded border border-amber-500/50">
                      Bảo trì
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 text-center bg-gradient-to-b from-[#1a1f2e] to-black flex-1 flex flex-col items-center justify-center gap-1">
                <h3 className="text-yellow-500 font-bold text-[13px] uppercase tracking-wider line-clamp-2 leading-snug">{game.name}</h3>
                {limits && <p className="text-[10px] text-slate-500 leading-tight">{limits}</p>}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer */}
      <footer className="mt-auto py-6 bg-[#05090a] border-t border-white/5 text-center">
        <p className="text-xs text-slate-500">Copyright 2026 © <strong className="text-slate-400">Corona Resort & Casino.</strong></p>
      </footer>
    </div>
  );
}

// Map bank code -> display name
const BANK_DISPLAY_NAMES: Record<string, string> = {
  vcb: 'Vietcombank', ctg: 'VietinBank', bidv: 'BIDV', agribank: 'Agribank',
  tcb: 'Techcombank', mbb: 'MBBank', vpb: 'VPBank', acb: 'ACB', stb: 'Sacombank',
  hdb: 'HDBank', vib: 'VIB', tpb: 'TPBank', shb: 'SHB', eib: 'Eximbank',
  ssb: 'SeABank', msb: 'MSB', lpb: 'LPBank', ocb: 'OCB', nab: 'Nam A Bank',
  bab: 'Bac A Bank', abb: 'ABBank', vab: 'VietA Bank', klb: 'Kienlongbank',
  ncb: 'NCB', vbb: 'Vietbank', sgb: 'Saigonbank', pgb: 'PGBank', bvb: 'BaoViet Bank',
  bvbank: 'BVBank', dab: 'DongA Bank', scb: 'SCB',
  shinhan: 'Shinhan Bank', hsbc: 'HSBC', sc: 'Standard Chartered', uob: 'UOB',
  woori: 'Woori Bank', cimb: 'CIMB', public: 'Public Bank',
  ocean: 'OceanBank', gp: 'GPBank', cb: 'CBBank',
};

// --- MÀN HÌNH 1: THÊM THẺ NGÂN HÀNG ---
function AddCardScreen({ onBack, onLinkSuccess, user, useApi }: { onBack: () => void, onLinkSuccess: () => void, user: any, useApi?: boolean }) {
  const vipColors = useVipColorsContext();
  const currentVip = VIP_CONFIG.find(v => v.level === user.vipLevel) || VIP_CONFIG[0];
  const c = vipColors[user.vipLevel] ?? vipColors[0];

  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    if (!bank) {
      alert("Vui lòng chọn ngân hàng!");
      return;
    }
    if (!accountNumber) {
      alert("Vui lòng nhập số tài khoản!");
      return;
    }
    if (password.length !== 6) {
      alert("Vui lòng thiết lập mật khẩu rút tiền 6 số!");
      return;
    }
    if (useApi) {
      setLoading(true);
      try {
        const { authApi } = await import('./api/client');
        const bankName = BANK_DISPLAY_NAMES[bank] || bank;
        await authApi.updateBank(bankName, accountNumber.trim(), password);
        onLinkSuccess();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setLoading(false);
      }
    } else {
      onLinkSuccess();
    }
  };

  return (
    <div className="relative flex h-full min-h-screen w-full max-w-md mx-auto flex-col shadow-2xl overflow-x-hidden diamond-texture text-slate-100 font-sans">
      {/* TopAppBar */}
      <div className="flex items-center bg-black/80 backdrop-blur-md sticky top-0 z-50 p-4 border-b border-yellow-500/20">
        <button 
          onClick={onBack}
          className="text-yellow-500 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-yellow-500/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-slate-100 text-xl font-bold leading-tight tracking-tight flex-1 text-center pr-10 uppercase tracking-widest">
          Thêm thẻ ngân hàng
        </h2>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto no-scrollbar">
        {/* Decorative VIP Card Preview */}
        <div className="mb-10 group">
          <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between p-6 border backdrop-blur-md transition-colors duration-500" style={{ borderColor: c.border, background: `linear-gradient(135deg, ${c.from}, ${c.to})`, opacity: 0.95 }}>
            <div className="flex justify-between items-start">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Corona_Resort_%26_Casino_Phu_Quoc_Logo.png/320px-Corona_Resort_%26_Casino_Phu_Quoc_Logo.png" 
                alt="Corona Casino" 
                className="h-8 object-contain drop-shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                <Building2 className="text-yellow-500" size={28} />
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80" style={{ color: c.text }}>{currentVip.colorName} Member</p>
                <p className="text-white text-sm font-bold">VIP CASINO CARD</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-8 w-12 rounded-md opacity-80 border" style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})`, borderColor: c.border }}></div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full w-1/3" style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})` }}></div>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="opacity-60 text-[10px] uppercase tracking-widest" style={{ color: c.text }}>Card Holder</p>
                <p className="text-slate-100 text-lg font-bold tracking-[0.1em] uppercase">{user.fullName}</p>
              </div>
            </div>
            
            {/* Decorative patterns */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-colors duration-500" style={{ backgroundColor: c.bg }}></div>
            <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-colors duration-500" style={{ backgroundColor: c.bg }}></div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-8">
          <div className="relative">
            <label className="block text-yellow-500/80 text-xs font-bold uppercase tracking-widest mb-2 px-1">Chọn ngân hàng</label>
            <div className="relative">
              <select 
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full bg-black/40 border-0 border-b-2 border-yellow-500/30 focus:border-yellow-500 focus:ring-0 text-slate-100 py-4 px-1 text-base appearance-none transition-all cursor-pointer outline-none"
              >
                <option disabled value="">Chọn ngân hàng từ danh sách</option>
                <optgroup label="Ngân hàng Nhà nước & Cổ phần Nhà nước">
                  <option value="vcb">Vietcombank - NH TMCP Ngoại thương VN</option>
                  <option value="ctg">VietinBank - NH TMCP Công Thương VN</option>
                  <option value="bidv">BIDV - NH TMCP Đầu tư và Phát triển VN</option>
                  <option value="agribank">Agribank - NH Nông nghiệp và PTNT VN</option>
                </optgroup>
                <optgroup label="Ngân hàng Thương mại Cổ phần (TMCP)">
                  <option value="tcb">Techcombank - NH TMCP Kỹ Thương VN</option>
                  <option value="mbb">MBBank - NH TMCP Quân Đội</option>
                  <option value="vpb">VPBank - NH TMCP VN Thịnh Vượng</option>
                  <option value="acb">ACB - NH TMCP Á Châu</option>
                  <option value="stb">Sacombank - NH TMCP Sài Gòn Thương Tín</option>
                  <option value="hdb">HDBank - NH TMCP Phát triển TP.HCM</option>
                  <option value="vib">VIB - NH TMCP Quốc Tế VN</option>
                  <option value="tpb">TPBank - NH TMCP Tiên Phong</option>
                  <option value="shb">SHB - NH TMCP Sài Gòn - Hà Nội</option>
                  <option value="eib">Eximbank - NH TMCP Xuất Nhập Khẩu VN</option>
                  <option value="ssb">SeABank - NH TMCP Đông Nam Á</option>
                  <option value="msb">MSB - NH TMCP Hàng Hải VN</option>
                  <option value="lpb">LPBank - NH TMCP Lộc Phát VN</option>
                  <option value="ocb">OCB - NH TMCP Phương Đông</option>
                  <option value="nab">Nam A Bank - NH TMCP Nam Á</option>
                  <option value="bab">Bac A Bank - NH TMCP Bắc Á</option>
                  <option value="abb">ABBank - NH TMCP An Bình</option>
                  <option value="vab">VietA Bank - NH TMCP Việt Á</option>
                  <option value="klb">Kienlongbank - NH TMCP Kiên Long</option>
                  <option value="ncb">NCB - NH TMCP Quốc Dân</option>
                  <option value="vbb">Vietbank - NH TMCP VN Thương Tín</option>
                  <option value="sgb">Saigonbank - NH TMCP Sài Gòn Công Thương</option>
                  <option value="pgb">PGBank - NH TMCP Thịnh vượng và Phát triển</option>
                  <option value="bvb">BaoViet Bank - NH TMCP Bảo Việt</option>
                  <option value="bvbank">BVBank - NH TMCP Bản Việt</option>
                  <option value="dab">DongA Bank - NH TMCP Đông Á</option>
                  <option value="scb">SCB - NH TMCP Sài Gòn</option>
                </optgroup>
                <optgroup label="Ngân hàng 100% vốn nước ngoài & Khác">
                  <option value="shinhan">Shinhan Bank Vietnam</option>
                  <option value="hsbc">HSBC Vietnam</option>
                  <option value="sc">Standard Chartered Vietnam</option>
                  <option value="uob">UOB Vietnam</option>
                  <option value="woori">Woori Bank Vietnam</option>
                  <option value="cimb">CIMB Vietnam</option>
                  <option value="public">Public Bank Vietnam</option>
                  <option value="ocean">OceanBank - NH TNHH MTV Đại Dương</option>
                  <option value="gp">GPBank - NH TNHH MTV Dầu Khí Toàn Cầu</option>
                  <option value="cb">CBBank - NH TNHH MTV Xây dựng VN</option>
                </optgroup>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-500 pointer-events-none" size={20} />
            </div>
          </div>

          <div className="relative">
            <label className="block text-yellow-500/80 text-xs font-bold uppercase tracking-widest mb-2 px-1">Số tài khoản</label>
            <input 
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-black/40 border-0 border-b-2 border-yellow-500/30 focus:border-yellow-500 focus:ring-0 text-slate-100 py-4 px-1 text-base placeholder:text-slate-600 transition-all outline-none" 
              placeholder="Nhập số tài khoản của bạn" 
              type="text"
            />
          </div>

          <div className="relative">
            <label className="block text-yellow-500/80 text-xs font-bold uppercase tracking-widest mb-2 px-1">Tên chủ tài khoản</label>
            <input 
              value={user.fullName}
              readOnly
              className="w-full bg-black/40 border-0 border-b-2 border-yellow-500/30 focus:border-yellow-500 focus:ring-0 text-slate-100 py-4 px-1 text-base uppercase placeholder:text-slate-600 transition-all outline-none opacity-70 cursor-not-allowed" 
              type="text"
            />
          </div>

          {/* Withdrawal Password Section */}
          <div className="pt-4 space-y-4">
            <div className="space-y-1">
              <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-widest px-1">ĐĂNG KÝ MẬT KHẨU RÚT TIỀN</h3>
              <p className="text-slate-400 text-[11px] px-1 font-medium">Vui lòng thiết lập mật khẩu 6 số để bảo mật giao dịch của bạn.</p>
            </div>
            <div className="relative flex justify-between items-center px-1 py-4">
              <input 
                type="number" 
                maxLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, 6))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
              />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`size-10 rounded-full border ${password.length > i ? 'border-yellow-500' : 'border-yellow-500/40'} flex items-center justify-center ${password.length > i ? 'bg-yellow-500/20' : 'bg-black/40'} transition-colors`}>
                  {password.length > i && <div className="size-2 rounded-full bg-yellow-500"></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 pt-4 opacity-70">
            <ShieldCheck className="text-yellow-500" size={16} />
            <p className="text-slate-400 text-xs font-medium tracking-tight">Thông tin của bạn được bảo mật tuyệt đối</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6 pb-10 bg-gradient-to-t from-black via-black to-transparent">
        <button 
          onClick={handleLink}
          disabled={loading}
          className="w-full py-5 metallic-gold text-black font-black text-lg rounded-xl shadow-[0_10px_30px_rgba(212,175,53,0.3)] hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang lưu...' : 'Liên kết ngân hàng'}
        </button>
        <div className="mt-6 flex justify-center gap-6 opacity-30 grayscale">
          <img alt="Visa" className="h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWA1BZLv_WNWOIXzTw9Akdf65Y1I2whQh_KpnxH4dwt0k2MVK5CdcdVr4p4ug2aKH_Vtt4PgWpho4YcqU1d2U5iKnHX6nPF07nRDwXY_EGvbiU_T6D3axbpDVVkoZbu67v78OfFqbAwoJhB9cd6b7zizKWX7F59gN4GzE9328yz-CmE1VGp9yT-oZRPtaCwfFr07K6flDoIMlPssHU5t9La5HB0msYxJfRrcTOOnuIKtVARlEGXqmkcEVkgyxgy26_1Dt7ZywKZauK" />
          <img alt="Mastercard" className="h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyr40GSb4dKPLT8rhjyswa8ogsPZQBilJr-8apIxMDUw-0C551uO1HILWY9PEMGfESKnCmQllPMbLEiwBsznAcsLdjyct6UnTHOZdSQvYBce6Ea-xRKcd2F9Xv-5H15m60GafCOt-Ze5TVyr_hm0qybJUPZ2q7AKYhJuPeZq6opmz3G6FMjW2J7RQMMMkcMSKX-ylgMWud3mZyxJMxPBLfYiwts-tHJ_m-x54GX2BHhtnsMVU4DwpS8cCsk-POFdjfotygI38X0tSQ" />
          <img alt="PCI" className="h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOT8NgFcD3joujGZNX9qfqhBU3BO0Q4l_4lZGkYSknvPFZ3gOpRAYkr9jsrpEO487-VkIoftyGMcq_eW146T8cGorCwzz3i1YpnCz8xRDYzi1t3MfTQ56ForkhpKUiPU2OQ7RA4amhhQQpGaj_pxZ0wxMtu3aFt1Qj9K2og5hxTy_9L-CCZq-iUPJZdqzPgmoi9_OiHfR7X3YXzOaFqDpNvL8wgJAaq2W1066_vxJInHGZ_tTxRL5ztk7why94WQ0cN7lTvXU5Z_mn" />
        </div>
      </div>
    </div>
  );
}

// --- MÀN HÌNH 2: NẠP TIỀN ---
function DepositScreen({ onBack, onDepositSubmit, user, useApi, isOnline = true }: { onBack: () => void, onDepositSubmit: (amount: number) => void, user: any, useApi?: boolean, isOnline?: boolean }) {
  const vipColors = useVipColorsContext();
  const currentVip = VIP_CONFIG.find(v => v.level === user.vipLevel) || VIP_CONFIG[0];
  const c = vipColors[user.vipLevel] ?? vipColors[0];

  const [activeMethod, setActiveMethod] = useState('bank');
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!");
      return;
    }
    // Chuyển hướng đến Chat trực tiếp với tin nhắn mẫu (cả useApi và store)
    onDepositSubmit(numAmount);
  };

  return (
    <div 
      className="relative min-h-screen w-full flex items-center justify-center p-4 font-sans"
      style={{ 
        backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDUIQQcIr8cU0l5dXMX21lRLfJJsUK-2JxtYCz7d1KB1-C7eNo-vizx_u2hqVkYEmTOvsuYu0EqBE1M0VswPqCOw_lOkJ1eS6dJtVTY06O1swqiIVDzgTpMLEJSduwBP39LwFu3JlW2NqZyXCpvAORCAGtpj_KDQugOVeL-yc1lQzTQYfide2eXrOySBW36p8YmiOOE95vPzU38oIAndAowxjbw7KO3EqKX9Vp-eHd0sh3vUV-wn386z7v1dun4KWR5t9nS25dRwRyK')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="fixed inset-0 bg-black/80 z-0 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-[500px] glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/20">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wallet className="text-emerald-500" size={24} />
            Nạp tiền
          </h2>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <X className="text-slate-300" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar">
          {/* Premium Card */}
          <div className="rounded-2xl p-6 border relative group overflow-hidden backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-colors duration-500" style={{ borderColor: c.border, background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-9 card-chip border border-white/20 shadow-inner rounded-md relative overflow-hidden">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-black/20 -translate-y-1/2"></div>
                    <div className="absolute left-[30%] top-0 bottom-0 w-px bg-black/20"></div>
                  </div>
                  <Wifi className="text-white/50 rotate-90" size={24} />
                </div>
                <div className="px-3 py-1 rounded-full border backdrop-blur-sm" style={{ background: c.bg, borderColor: c.border }}>
                  <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: c.text }}>VIP {user.vipLevel}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="opacity-80 text-xs font-medium uppercase tracking-wider" style={{ color: c.text }}>Tổng số dư</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-white tracking-tight drop-shadow-md tabular-nums">
                    <AnimatedBalance balance={user.balance} />
                  </p>
                  <span className="opacity-80 text-sm font-medium self-end mb-1.5" style={{ color: c.text }}>USD</span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div className="text-xs opacity-80 font-mono tracking-widest" style={{ color: c.text }}>{user.username}</div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <Shield className="text-white" size={12} />
                  </div>
                  <span className="text-[10px] opacity-80 font-medium uppercase" style={{ color: c.text }}>Secured</span>
                </div>
              </div>
            </div>

            {/* Decorative patterns */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-colors duration-500" style={{ backgroundColor: c.bg }}></div>
            <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-colors duration-500" style={{ backgroundColor: c.bg }}></div>
          </div>

          {/* Deposit Methods */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300 ml-1">Phương thức nạp tiền</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActiveMethod('bank')}
                className={`p-3 rounded-xl flex items-center gap-3 relative overflow-hidden group transition-all border ${activeMethod === 'bank' ? 'bg-emerald-500/15 border-emerald-500' : 'bg-white/5 border-white/10 hover:border-slate-500/50'}`}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                  <Landmark className="text-blue-400" size={20} />
                </div>
                <div className="text-left">
                  <span className={`block text-sm font-bold ${activeMethod === 'bank' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>Bank Transfer</span>
                  <span className="block text-[10px] text-slate-400">24/7 Auto</span>
                </div>
                {activeMethod === 'bank' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                )}
              </button>

              <button 
                onClick={() => setActiveMethod('ewallet')}
                className={`p-3 rounded-xl flex items-center gap-3 relative overflow-hidden group transition-all border ${activeMethod === 'ewallet' ? 'bg-emerald-500/15 border-emerald-500' : 'bg-white/5 border-white/10 hover:border-slate-500/50'}`}
              >
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                  <Wallet className="text-purple-400" size={20} />
                </div>
                <div className="text-left">
                  <span className={`block text-sm font-bold ${activeMethod === 'ewallet' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>E-Wallet</span>
                  <span className="block text-[10px] text-slate-400">Momo, ZaloPay</span>
                </div>
                {activeMethod === 'ewallet' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                )}
              </button>

              <button 
                onClick={() => setActiveMethod('crypto')}
                className={`p-3 rounded-xl flex items-center gap-3 relative overflow-hidden group transition-all border ${activeMethod === 'crypto' ? 'bg-emerald-500/15 border-emerald-500' : 'bg-white/5 border-white/10 hover:border-slate-500/50'}`}
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center border border-emerald-500/30">
                  <Bitcoin className="text-emerald-400" size={20} />
                </div>
                <div className="text-left">
                  <span className={`block text-sm font-bold ${activeMethod === 'crypto' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>USDT</span>
                  <span className="block text-[10px] text-slate-400">TRC20, ERC20</span>
                </div>
                {activeMethod === 'crypto' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                )}
              </button>

              <button 
                onClick={() => setActiveMethod('card')}
                className={`p-3 rounded-xl flex items-center gap-3 relative overflow-hidden group transition-all border ${activeMethod === 'card' ? 'bg-emerald-500/15 border-emerald-500' : 'bg-white/5 border-white/10 hover:border-slate-500/50'}`}
              >
                <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center border border-orange-500/30">
                  <CreditCard className="text-orange-400" size={20} />
                </div>
                <div className="text-left">
                  <span className={`block text-sm font-bold ${activeMethod === 'card' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>Thẻ cào</span>
                  <span className="block text-[10px] text-slate-400">Phí 15%</span>
                </div>
                {activeMethod === 'card' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                )}
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-300 ml-1">Số tiền nạp</label>
              <span className="text-xs text-slate-500">Tối thiểu: 50,000 VND</span>
            </div>
            
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-400 group-focus-within:text-emerald-500 transition-colors">$</span>
              <input 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 h-14 pl-10 pr-20 rounded-xl text-xl font-bold focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-white placeholder:text-slate-600 transition-all" 
                placeholder="0" 
                type="number"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors">
                USD
              </button>
            </div>

            {/* Quick Amounts */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: '5K', value: 5000 },
                { label: '10K', value: 10000 },
                { label: '50K', value: 50000 },
                { label: '100K', value: 100000 },
                { label: '500K', value: 500000 }
              ].map((btn) => (
                <button 
                  key={btn.label}
                  onClick={() => setAmount(btn.value.toString())}
                  className="bg-white/5 border border-white/10 hover:bg-emerald-500/15 hover:border-emerald-500 hover:text-emerald-500 py-2 px-1 rounded-lg text-xs font-semibold text-slate-300 transition-all hover:-translate-y-0.5"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Ngân hàng nhận</span>
              <span className="text-white font-medium">Vietcombank</span>
            </div>
            <div className="w-full h-px bg-white/5"></div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={14} />
              <p className="text-[11px] text-slate-400 leading-tight">
                Vui lòng nhập chính xác nội dung chuyển khoản để hệ thống tự động cộng tiền.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            disabled={useApi && !isOnline}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận nạp tiền
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-[11px] uppercase tracking-widest font-semibold">
            <Lock size={14} />
            Secure 256-bit SSL Payment
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MÀN HÌNH 4: RÚT TIỀN ---
function WithdrawScreen({ onBack, user, onWithdrawSubmit, useApi, isOnline = true, onSyncBalance }: { onBack: () => void, user: any, onWithdrawSubmit: (amount: number) => void, useApi?: boolean, isOnline?: boolean, onSyncBalance?: () => void }) {
  const vipColors = useVipColorsContext();
  const currentVip = VIP_CONFIG.find(v => v.level === user.vipLevel) || VIP_CONFIG[0];
  const c = vipColors[user.vipLevel] ?? vipColors[0];

  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!");
      return;
    }
    if (numAmount > user.balance) {
      alert("Số dư không đủ!");
      return;
    }
    if (useApi) {
      if (!isOnline) {
        alert('Mất kết nối. Vui lòng thử lại sau.');
        return;
      }
      try {
        const { walletApi } = await import('./api/client');
        const bankInfo = (user.bankName && user.bankAccountNumber)
          ? { bankName: user.bankName, bankAccountNumber: user.bankAccountNumber }
          : undefined;
        await walletApi.withdrawRequest(numAmount, bankInfo);
        onSyncBalance?.();
        alert('Yêu cầu rút tiền đã gửi. Số tiền đã được trừ. Admin sẽ xử lý trong thời gian sớm nhất.');
        onBack();
      } catch (e) {
        alert((e as Error).message);
      }
    } else {
      onWithdrawSubmit(numAmount);
    }
  };

  return (
    <div 
      className="relative min-h-screen w-full flex items-center justify-center p-4 font-sans"
      style={{ 
        backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDUIQQcIr8cU0l5dXMX21lRLfJJsUK-2JxtYCz7d1KB1-C7eNo-vizx_u2hqVkYEmTOvsuYu0EqBE1M0VswPqCOw_lOkJ1eS6dJtVTY06O1swqiIVDzgTpMLEJSduwBP39LwFu3JlW2NqZyXCpvAORCAGtpj_KDQugOVeL-yc1lQzTQYfide2eXrOySBW36p8YmiOOE95vPzU38oIAndAowxjbw7KO3EqKX9Vp-eHd0sh3vUV-wn386z7v1dun4KWR5t9nS25dRwRyK')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="fixed inset-0 bg-black/80 z-0 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-[500px] glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/20">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Landmark className="text-blue-500" size={24} />
            Rút tiền
          </h2>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <X className="text-slate-300" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar">
          {/* Balance Card */}
          <div className="rounded-2xl p-6 border relative group overflow-hidden backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-colors duration-500" style={{ borderColor: c.border, background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="opacity-80 text-xs font-medium uppercase tracking-wider mb-1" style={{ color: c.text }}>Số dư có thể rút</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
                      <AnimatedBalance balance={user.balance} />
                    </p>
                    <span className="opacity-80 text-sm font-medium self-end mb-1.5" style={{ color: c.text }}>USD</span>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full border backdrop-blur-sm" style={{ background: c.bg, borderColor: c.border }}>
                  <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: c.text }}>VIP {user.vipLevel}</span>
                </div>
              </div>
            </div>

            {/* Decorative patterns */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-colors duration-500" style={{ backgroundColor: c.bg }}></div>
            <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-colors duration-500" style={{ backgroundColor: c.bg }}></div>
          </div>

          {/* Bank Info - Tự động cập nhật từ thẻ đã lưu */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300 ml-1">Tài khoản nhận tiền</label>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                <Building2 className="text-blue-400" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{user.bankName || '—'}</p>
                <p className="text-slate-400 text-sm font-mono tracking-widest">
                  {user.bankAccountNumber ? `**** ${String(user.bankAccountNumber).slice(-4)}` : '—'}
                </p>
                <p className="text-slate-500 text-xs uppercase mt-1 truncate">{user.fullName}</p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-300 ml-1">Số tiền rút</label>
              <button 
                onClick={() => setAmount(user.balance.toString())}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider"
              >
                Rút toàn bộ
              </button>
            </div>
            
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-400 group-focus-within:text-blue-500 transition-colors">$</span>
              <input 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 h-14 pl-10 pr-20 rounded-xl text-xl font-bold focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-white placeholder:text-slate-600 transition-all" 
                placeholder="0" 
                type="number"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors">
                USD
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={14} />
              <p className="text-[11px] text-slate-400 leading-tight">
                Lệnh rút tiền sẽ được xử lý trong vòng 5-15 phút. Vui lòng đảm bảo thông tin tài khoản nhận là chính xác.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            disabled={useApi && !isOnline}
            className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận rút tiền
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-[11px] uppercase tracking-widest font-semibold">
            <Lock size={14} />
            Secure 256-bit SSL Payment
          </div>
        </div>
      </div>
    </div>
  );
}

/** Nén ảnh phía client trước khi upload lên API support. */
async function imageFileToJpegDataUrl(file: File, maxW = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}

type SupportChatLine = { id: string; sender: 'user' | 'cs'; text: string; time: string; attachmentUrl?: string | null };

// --- MÀN HÌNH 5: TRUNG TÂM HỖ TRỢ (sau đăng nhập): chat CS, thông báo admin, FAQ ---
function ContactScreen({ onOpenMenu, onBack, user, useApi = false, initialChatOpen = false, initialMessage = '' }: { onOpenMenu: () => void, onBack: () => void, user: any, useApi?: boolean, initialChatOpen?: boolean, initialMessage?: string }) {
  const [isChatOpen, setIsChatOpen] = useState(initialChatOpen);
  const [isNoticesOpen, setIsNoticesOpen] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [chatHistory, setChatHistory] = useState<SupportChatLine[]>([]);
  const [pendingImage, setPendingImage] = useState<{ url: string; preview: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const chatImageInputRef = useRef<HTMLInputElement>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const ticketIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorImg, setErrorImg] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { notices, unreadCount: noticeUnread, markNoticesSeen } = usePlayerNotifications();

  const currentVip = VIP_CONFIG.find(v => v.level === user.vipLevel) || VIP_CONFIG[0];

  useEffect(() => {
    ticketIdRef.current = ticketId;
  }, [ticketId]);

  useEffect(() => {
    if (isNoticesOpen) markNoticesSeen();
  }, [isNoticesOpen, markNoticesSeen]);

  // Load tickets & messages when using API
  useEffect(() => {
    if (!useApi) {
      setChatHistory([
        { id: '1', sender: 'cs', text: 'Chào bạn! Vui lòng đăng nhập để chat trực tiếp với Admin.', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
      ]);
      if (initialMessage) {
        setChatHistory(prev => [...prev, { id: '2', sender: 'user', text: initialMessage, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }]);
      }
      return;
    }
    let active = true;
    (async () => {
      try {
        const { supportApi } = await import('./api/client');
        const { tickets } = await supportApi.getTickets();
        if (!active) return;
        if (tickets.length > 0) {
          const t = tickets[0];
          ticketIdRef.current = t.id;
          setTicketId(t.id);
          const msgs = (t.messages || []).map((m: any) => ({
            id: m.id || String(Math.random()),
            sender: m.senderRole === 'admin' ? 'cs' : 'user',
            text: m.content || '',
            attachmentUrl: m.attachmentUrl || null,
            time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
          }));
          setChatHistory(msgs.length ? msgs : [{ id: '1', sender: 'cs', text: 'Chào bạn! Admin sẽ phản hồi trong thời gian sớm nhất.', time: '' }]);
        } else {
          setChatHistory([{ id: '1', sender: 'cs', text: 'Chào bạn! Nhấn gửi tin nhắn để bắt đầu chat với Admin.', time: '' }]);
        }
      } catch {
        if (active) setChatHistory([{ id: '1', sender: 'cs', text: 'Không thể tải tin nhắn. Vui lòng thử lại.', time: '' }]);
      }
    })();
    return () => { active = false; };
  }, [useApi]);

  const { socket } = useAppSocket();

  /** Realtime ticket: lắng nghe ngay cả khi ticketId chưa set (gắn ticket khi admin trả lời đầu tiên). */
  useEffect(() => {
    if (!useApi || !socket) return;
    const handler = (payload: { ticketId: string; message: { id: string; content: string; senderRole: string; createdAt: string } }) => {
      if (payload.message.senderRole !== 'admin') return;
      let tid = ticketIdRef.current;
      if (!tid) {
        tid = payload.ticketId;
        ticketIdRef.current = tid;
        setTicketId(tid);
      }
      if (payload.ticketId !== tid) return;
      setChatHistory((prev) => {
        if (prev.some((m) => m.id === payload.message.id)) return prev;
        return [
          ...prev,
          {
            id: payload.message.id,
            sender: 'cs' as const,
            text: payload.message.content,
            attachmentUrl: (payload.message as { attachmentUrl?: string | null }).attachmentUrl ?? null,
            time: new Date(payload.message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      });
    };
    socket.on('support_message', handler);
    return () => {
      socket.off('support_message', handler);
    };
  }, [useApi, socket]);

  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatOpen, chatHistory]);

  const handlePickChatImage = async (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (!useApi) {
      alert('Đăng nhập để gửi hình cho Admin.');
      return;
    }
    setUploadingImage(true);
    setErrorImg(null);
    try {
      const dataUrl = await imageFileToJpegDataUrl(file);
      const { supportApi } = await import('./api/client');
      const { url } = await supportApi.uploadSupportImage(dataUrl);
      setPendingImage({ url, preview: dataUrl });
    } catch (e) {
      setErrorImg((e as Error).message || 'Không tải được ảnh');
    } finally {
      setUploadingImage(false);
      if (chatImageInputRef.current) chatImageInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    const text = message.trim();
    if (!text && !pendingImage) return;
    const displayText = text || (pendingImage ? '📷 Hình ảnh đính kèm' : '');
    setMessage('');
    const imgSnap = pendingImage;
    setPendingImage(null);

    if (!useApi) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'user',
          text: displayText,
          attachmentUrl: imgSnap?.preview ?? null,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    setLoading(true);
    const tempId = `tmp_${Date.now()}`;
    const newMsg: SupportChatLine = {
      id: tempId,
      sender: 'user',
      text: displayText,
      attachmentUrl: imgSnap?.url ?? null,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatHistory((prev) => [...prev, newMsg]);

    try {
      const { supportApi } = await import('./api/client');
      let tid = ticketId;
      if (!tid) {
        const { ticket } = await supportApi.createTicket('Chat hỗ trợ');
        tid = ticket.id;
        ticketIdRef.current = tid;
        setTicketId(tid);
      }
      const { message: saved } = await supportApi.sendMessage(tid, displayText, imgSnap ? { attachmentUrl: imgSnap.url, attachmentType: 'image' } : undefined);
      setChatHistory((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: saved.id,
                sender: 'user',
                text: saved.content,
                attachmentUrl: saved.attachmentUrl ?? null,
                time: new Date(saved.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              }
            : m
        )
      );
    } catch {
      setChatHistory((prev) => prev.filter((m) => m.id !== tempId));
      setMessage(text);
      if (imgSnap) setPendingImage(imgSnap);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center bg-black/90 backdrop-blur-md px-4 py-4 border-b border-white/10">
        <button onClick={onOpenMenu} className="text-slate-300 p-2 hover:text-white transition-colors">
          <Menu size={24} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728]">
            TRUNG TÂM HỖ TRỢ
          </h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Chat CS · Thông báo · FAQ</p>
        </div>
        <div className="w-10 flex justify-end">
          <button onClick={onBack} className="text-slate-300 p-2 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative w-full h-72 overflow-hidden shrink-0">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC_D4zt-7_oSFnUt6CF9yLXpJCn03HpkKpMHbpLstyaQ5lhsw7IItQOTnq_btUxxlur-xpxARBeqrzLaPADMMIRUleUxOFEjj-tXqtZ0Azyqlg70tMDD1WkGSl0IbX2I3faUXIfmh166qrKIEZtk5jcEVf1PXVQ-RKXJpO9L8lQNfxqwFSnme3Ny31rj7WkXmp6oar_9QV8uwLeSMXEtP3v3bVb-CyhAjD1wEhy0f9yKj_C7Scq_iyt0aa7M2BCwzR2Z_jg3w0wSCTK')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/40 to-transparent"></div>
        </div>
        
        {/* Floating VIP Card */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-5 border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="text-white" size={28} />
                <h2 className="text-xl font-bold text-slate-100">Quản gia riêng</h2>
              </div>
              <p className="text-sm text-slate-300 mb-4 italic">Dịch vụ chăm sóc khách hàng đặc quyền dành riêng cho thành viên VIP Corona 24/7.</p>
              <button 
                onClick={() => setIsChatOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-slate-700 to-black text-white font-bold rounded-lg border border-slate-500/50 shadow-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98]"
              >
                <Phone size={18} />
                LIÊN HỆ NGAY
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Kênh: chat ticket + thông báo admin (broadcast / gửi riêng) + hotline */}
      <main className="px-4 mt-8 space-y-6 relative z-10">
        <section>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Liên hệ, chat &amp; thông báo</h3>
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => setIsChatOpen(true)} className="w-full bg-[#0a0a0a] rounded-xl p-4 flex items-center gap-4 border border-slate-400/20 hover:bg-white/5 transition-colors text-left">
              <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700 shrink-0">
                <MessageCircle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-100">Chat với CS / Admin</h4>
                <p className="text-xs text-slate-400">Ticket realtime — cùng kênh Admin xử lý trong mục Chat</p>
              </div>
              <ChevronRight className="text-slate-600 shrink-0" size={24} />
            </button>

            <button
              type="button"
              onClick={() => setIsNoticesOpen(true)}
              className="relative w-full bg-[#0a0a0a] rounded-xl p-4 flex items-center gap-4 border border-slate-400/20 hover:bg-white/5 transition-colors text-left"
            >
              <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 border border-amber-700/40 shrink-0">
                <Bell size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-100">Thông báo</h4>
                <p className="text-xs text-slate-400">
                  Tin từ Admin: thông báo toàn hệ thống &amp; tin gửi riêng (mục Chat → Thông báo / Gửi cá nhân)
                </p>
              </div>
              {useApi && noticeUnread > 0 && (
                <span className="absolute top-3 right-12 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-amber-600 text-black text-xs font-black">
                  {noticeUnread > 99 ? '99+' : noticeUnread}
                </span>
              )}
              <ChevronRight className="text-slate-600 shrink-0" size={24} />
            </button>

            <button type="button" className="w-full bg-[#0a0a0a] rounded-xl p-4 flex items-center gap-4 border border-slate-400/20 hover:bg-white/5 transition-colors text-left">
              <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700 shrink-0">
                <HeadphonesIcon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-100">Đường dây nóng</h4>
                <p className="text-xs text-slate-400">Yêu cầu khẩn cấp 24/7 (cập nhật số hotline tại quầy)</p>
              </div>
              <ChevronRight className="text-slate-600 shrink-0" size={24} />
            </button>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Câu hỏi thường gặp (FAQ)</h3>
          </div>
          <div className="space-y-2">
            {[
              { q: 'Làm thế nào để trở thành hội viên VIP?', a: 'Tích lũy tổng nạp theo bảng VIP trong mục Ưu đãi / Trang cá nhân. Mức càng cao, quyền lợi càng nhiều.' },
              { q: 'Quy trình rút tiền thắng cược nhanh?', a: 'Vào Trang cá nhân → Rút tiền, đảm bảo đã liên kết tài khoản nhận. Lệnh thường xử lý trong vài phút đến vài giờ tùy hàng đợi.' },
              { q: 'Đặt phòng riêng (Private Room) như thế nào?', a: 'Liên hệ CS qua Chat trong Trung tâm hỗ trợ hoặc hotline để được hướng dẫn và xếp lịch.' },
              { q: 'Chính sách bảo mật thông tin cá nhân?', a: 'Thông tin tài khoản và giao dịch được mã hóa truyền tải. Không chia sẻ mật khẩu; mọi thông báo chính thức xem tại mục Thông báo.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-lg border border-slate-700/60 bg-[#0a0a0a]/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFaqOpen((x) => (x === i ? null : i))}
                  className="w-full p-4 flex items-center justify-between gap-2 text-left hover:bg-white/5 transition-colors border-l-4 border-amber-600/50"
                >
                  <span className="text-sm text-slate-200 font-medium">{faq.q}</span>
                  <ChevronDown className={`text-slate-400 shrink-0 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} size={18} />
                </button>
                {faqOpen === i && (
                  <div className="px-4 pb-4 pt-0 text-xs text-slate-400 leading-relaxed border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] w-full max-w-md mx-auto shadow-2xl animate-in slide-in-from-bottom-full duration-300">
          {/* Chat Header */}
          <div className="flex items-center border-b border-white/10 p-4 justify-between backdrop-blur-md z-10 bg-black/50 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{
              backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #fff, rgba(0,0,0,0))',
              backgroundSize: '200px 200px'
            }}></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <button onClick={() => setIsChatOpen(false)} className="text-yellow-500 flex items-center justify-center hover:scale-110 transition-transform">
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div 
                    className="size-10 rounded-full border-2 border-[#b8860b] bg-cover bg-center" 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCH0YpTqIeN2LpW9vW_RjXvE4S1K_Z1R2q3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0')" }}
                  ></div>
                  <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-[#0f0f0f]"></div>
                </div>
                <div>
                  <h2 className="text-white text-base font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728]">{useApi ? 'Admin' : 'CS Alexander'}</h2>
                  <p className="text-yellow-500/70 text-xs font-medium">{useApi ? 'Chat trực tiếp với Admin' : 'Đang trực tuyến'}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 relative z-10">
              <div className="size-10 flex items-center justify-center p-1 rounded-full bg-white/5 border border-white/10 shadow-lg">
                <img 
                  alt="Casino Corona Logo" 
                  className="h-full w-auto object-contain" 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Corona_Resort_%26_Casino_Phu_Quoc_Logo.png/320px-Corona_Resort_%26_Casino_Phu_Quoc_Logo.png"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden"><Building2 className="text-yellow-500" size={20} /></div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar" style={{ backgroundImage: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)' }}>
            <div className="flex flex-col items-center">
              <span className="text-[#b8860b]/40 text-[9px] uppercase tracking-[0.3em] font-bold py-6">Cuộc hội thoại bảo mật • Hôm nay</span>
            </div>
            
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-3 max-w-[85%] ${msg.sender === 'user' ? 'justify-end ml-auto' : ''}`}>
                {msg.sender === 'cs' && (
                  <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0 border-2 border-[#b8860b] shadow-sm" 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCH0YpTqIeN2LpW9vW_RjXvE4S1K_Z1R2q3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0')" }}
                  ></div>
                )}
                
                <div className={`flex flex-col gap-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${msg.sender === 'user' ? 'text-yellow-500 mr-1' : 'text-[#b8860b] ml-1'}`}>
                    {msg.sender === 'user' ? `${currentVip.colorName} Member` : 'CS Alexander'}
                  </p>
                  <div 
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xl backdrop-blur-md ${
                      msg.sender === 'user' 
                        ? 'rounded-br-none text-yellow-500 bg-[rgba(212,175,55,0.15)] border border-yellow-500/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                        : 'rounded-bl-none text-slate-200 bg-[rgba(30,30,30,0.6)] border border-[#b8860b]/20'
                    }`}
                  >
                    {msg.attachmentUrl && (
                      <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                        <img src={msg.attachmentUrl} alt="" className="max-w-[220px] max-h-48 rounded-lg object-contain border border-white/10" />
                      </a>
                    )}
                    {msg.text ? <span className="whitespace-pre-wrap select-text">{msg.text}</span> : null}
                  </div>
                  <div className={`flex items-center gap-1 ${msg.sender === 'user' ? 'mr-2' : 'ml-2'}`}>
                    <span className="text-[9px] text-slate-500">{msg.time}</span>
                    {msg.sender === 'user' && <CheckCheck className="text-[12px] text-yellow-500" size={14} />}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="size-8 shrink-0 rounded-full border-2 border-yellow-500/50 bg-slate-800 flex items-center justify-center">
                    <span className="text-xs font-bold text-yellow-500">{user.fullName.charAt(0)}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input — dán chữ/ảnh; Shift+Enter xuống dòng */}
          <div className="p-4 bg-[#0f0f0f] border-t border-[#b8860b]/30 backdrop-blur-xl shrink-0">
            {errorImg && <p className="text-red-400 text-xs mb-2">{errorImg}</p>}
            {pendingImage && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-black/40 border border-amber-500/30">
                <img src={pendingImage.preview} alt="" className="h-14 w-14 rounded object-cover" />
                <span className="text-xs text-amber-200 flex-1">Ảnh sẽ gửi kèm tin nhắn</span>
                <button type="button" className="text-xs text-red-400 px-2" onClick={() => setPendingImage(null)}>
                  Bỏ
                </button>
              </div>
            )}
            <input
              ref={chatImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handlePickChatImage(e.target.files?.[0] ?? null)}
            />
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => chatImageInputRef.current?.click()}
                disabled={uploadingImage || !useApi}
                className="flex items-center justify-center size-10 rounded-full bg-[rgba(30,30,30,0.6)] border border-yellow-500/20 text-yellow-500 hover:bg-[#b8860b]/20 transition-colors shrink-0 disabled:opacity-40"
                title="Đính kèm ảnh"
              >
                <Paperclip size={20} />
              </button>
              <button
                type="button"
                onClick={() => chatImageInputRef.current?.click()}
                disabled={uploadingImage || !useApi}
                className="flex items-center justify-center size-10 rounded-full bg-[rgba(30,30,30,0.6)] border border-yellow-500/20 text-yellow-500 hover:bg-[#b8860b]/20 transition-colors shrink-0 disabled:opacity-40"
                title="Gửi ảnh"
              >
                <ImageIcon size={20} />
              </button>
              <div className="flex flex-1 flex-col bg-[rgba(30,30,30,0.6)] rounded-2xl min-h-[48px] px-3 py-2 border border-[#b8860b]/40 focus-within:border-yellow-500 transition-colors">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items || !useApi) return;
                    for (let i = 0; i < items.length; i++) {
                      const it = items[i];
                      if (it.kind === 'file' && it.type.startsWith('image/')) {
                        e.preventDefault();
                        const f = it.getAsFile();
                        if (f) void handlePickChatImage(f);
                        return;
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  rows={2}
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 text-sm outline-none resize-none min-h-[40px] max-h-28 select-text"
                  placeholder={useApi ? 'Nhập tin nhắn (có thể dán Ctrl+V). Shift+Enter xuống dòng.' : 'Đăng nhập để chat…'}
                  autoComplete="off"
                />
                {uploadingImage && <span className="text-[10px] text-amber-400">Đang tải ảnh lên…</span>}
              </div>
              <button
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={(!message.trim() && !pendingImage) || loading || uploadingImage}
                className="bg-gradient-to-br from-[#d4af37] via-[#f9e498] to-[#b8860b] size-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shrink-0"
              >
                <Send className="text-[#0f0f0f] ml-1" size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo từ Admin (broadcast + gửi riêng) — đồng bộ với Admin → Chat */}
      {isNoticesOpen && (
        <div className="fixed inset-0 z-[55] flex flex-col bg-[#0a0a0a] w-full max-w-md mx-auto shadow-2xl animate-in slide-in-from-bottom-full duration-300">
          <div className="flex items-center border-b border-white/10 p-4 justify-between bg-black/60 backdrop-blur-md shrink-0">
            <button type="button" onClick={() => setIsNoticesOpen(false)} className="text-amber-500 p-2 hover:scale-110 transition-transform">
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-white font-bold text-base tracking-tight">Thông báo</h2>
              <p className="text-[10px] text-slate-500">Từ Admin (toàn hệ thống / gửi riêng)</p>
            </div>
            <div className="w-10" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!useApi && (
              <p className="text-sm text-slate-400 text-center py-8">Đăng nhập để nhận thông báo realtime từ Admin.</p>
            )}
            {useApi && notices.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Chưa có thông báo. Admin gửi từ mục Chat → Thông báo toàn hệ thống hoặc Gửi cá nhân.</p>
            )}
            {useApi &&
              notices.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-amber-600/25 bg-[#141414] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        n.source === 'broadcast'
                          ? 'bg-amber-500/20 text-amber-300'
                          : n.source === 'system'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {n.source === 'broadcast' ? 'Toàn hệ thống' : n.source === 'system' ? 'Hệ thống' : 'Gửi riêng bạn'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(n.at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{n.content}</p>
                  {n.attachmentUrl ? (
                    n.attachmentType === 'video' ? (
                      <video src={n.attachmentUrl} controls className="mt-2 w-full max-h-48 rounded-lg bg-black" />
                    ) : n.attachmentType === 'file' ? (
                      <a
                        href={n.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs text-amber-400 underline"
                      >
                        Tải / mở đính kèm
                      </a>
                    ) : (
                      <a href={n.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                        <img
                          src={n.attachmentUrl}
                          alt=""
                          className="max-w-full max-h-48 rounded-lg object-contain border border-white/10"
                        />
                      </a>
                    )
                  ) : null}
                </div>
              ))}
          </div>
          <div className="p-4 border-t border-white/10 bg-[#0f0f0f] shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsNoticesOpen(false);
                setIsChatOpen(true);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-slate-700 to-black text-white font-bold border border-amber-600/40 flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              Mở chat CS / Admin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Lịch sử nạp / rút (người chơi) ---
function DepositWithdrawHistoryScreen({
  mode,
  onBack,
  useApi,
}: {
  mode: 'deposit' | 'withdraw';
  onBack: () => void;
  useApi: boolean;
}) {
  const [rows, setRows] = useState<Array<{ id: string; amount: number; status: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!useApi) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (mode === 'deposit') {
          const r = await walletApi.getDepositRequests();
          if (!cancelled) setRows((r.requests as typeof rows) || []);
        } else {
          const r = await walletApi.getWithdrawRequests();
          if (!cancelled) setRows((r.requests as typeof rows) || []);
        }
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, useApi]);

  const title = mode === 'deposit' ? 'Lịch sử nạp tiền' : 'Lịch sử rút tiền';

  return (
    <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col shadow-2xl overflow-x-hidden diamond-texture text-slate-100 font-sans p-6">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onBack} className="text-yellow-500 p-2 rounded-full hover:bg-yellow-500/10">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-yellow-500 tracking-wide uppercase flex items-center gap-2">
          <History size={22} />
          {title}
        </h1>
      </div>
      {!useApi && (
        <p className="text-slate-400 text-sm text-center py-12">Đăng nhập tài khoản để xem lịch sử qua hệ thống.</p>
      )}
      {useApi && loading && <p className="text-slate-400 text-center py-12">Đang tải…</p>}
      {useApi && !loading && rows.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-12">Chưa có yêu cầu nào.</p>
      )}
      <div className="space-y-3 flex-1 overflow-y-auto pb-8">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-lg text-amber-400">${Number(r.amount).toLocaleString()}</span>
              <span
                className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                  r.status === 'approved' || r.status === 'completed'
                    ? 'bg-green-900/60 text-green-300'
                    : r.status === 'rejected'
                      ? 'bg-red-900/60 text-red-300'
                      : 'bg-yellow-900/40 text-yellow-200'
                }`}
              >
                {r.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{new Date(r.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MÀN HÌNH 3: TRANG CÁ NHÂN ---
// Thẻ VIP, cài đặt thẻ, tự động cập nhật VIP chỉ hiển thị SAU ĐĂNG NHẬP
function ProfileScreen({ 
  user, 
  isLoggedIn,
  isSuperPlayerProfile,
  onOpenMenu,
  onDeposit, 
  onWithdraw,
  onDepositHistory,
  onWithdrawHistory,
  onLogout,
  onOpenLogin 
}: { 
  user: any, 
  isLoggedIn: boolean,
  isSuperPlayerProfile: boolean,
  onOpenMenu: () => void,
  onDeposit: () => void, 
  onWithdraw: () => void,
  onDepositHistory: () => void,
  onWithdrawHistory: () => void,
  onLogout: () => void,
  onOpenLogin?: () => void
}) {
  const vipColors = useVipColorsContext();
  const nextVip = VIP_CONFIG.find(v => v.level === user.vipLevel + 1);
  const c = vipColors[user.vipLevel] ?? vipColors[0];
  const isMaxVip = user.vipLevel >= 10;
  const vipProgressBase = Number(user.vipValidDepositTotal ?? user.totalDeposit ?? 0);
  const progress = nextVip ? Math.min(100, (vipProgressBase / nextVip.threshold) * 100) : 100;

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [profileMessage, setProfileMessage] = useState(() => {
    try {
      return localStorage.getItem(PROFILE_MESSAGE_STORAGE_KEY) || DEFAULT_PROFILE_MESSAGE;
    } catch {
      return DEFAULT_PROFILE_MESSAGE;
    }
  });
  const [isUnlockPassModalOpen, setIsUnlockPassModalOpen] = useState(false);
  const [unlockPassInput, setUnlockPassInput] = useState('');
  const [isHiddenMessageModalOpen, setIsHiddenMessageModalOpen] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState(profileMessage);

  useEffect(() => {
    if (isProfileEditorOpen) setProfileDraft(profileMessage);
  }, [isProfileEditorOpen, profileMessage]);

  const saveProfileMessage = () => {
    const next = profileDraft.slice(0, 8000);
    setProfileMessage(next);
    try {
      localStorage.setItem(PROFILE_MESSAGE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setIsProfileEditorOpen(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -15; 
    const rotateY = ((x - centerX) / centerX) * 15;
    
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Chưa đăng nhập: màn hình đơn giản, nhắc đăng nhập để xem thẻ VIP
  if (!isLoggedIn) {
    return (
      <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col shadow-2xl overflow-x-hidden diamond-texture text-slate-100 font-sans p-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onOpenMenu} className="text-yellow-500 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-yellow-500/10 transition-colors">
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-bold text-center text-yellow-500 tracking-widest uppercase">Trang Cá Nhân</h1>
          <div className="w-10" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Corona_Resort_%26_Casino_Phu_Quoc_Logo.png/320px-Corona_Resort_%26_Casino_Phu_Quoc_Logo.png" 
            alt="Corona Casino" 
            className="h-16 object-contain mb-6 opacity-90"
          />
          <p className="text-slate-300 text-sm font-medium text-center mb-2">TRUY CẬP KHÔNG GIAN ĐẶC QUYỀN DÀNH CHO THÀNH VIÊN</p>
          <p className="text-slate-500 text-xs text-center mb-8">Đăng nhập để xem thẻ VIP, số dư và sử dụng Nạp tiền / Rút tiền</p>
          <button 
            onClick={onOpenLogin}
            className="w-full max-w-xs py-4 bg-gradient-to-r from-yellow-600 to-yellow-700 text-black font-bold rounded-xl uppercase tracking-widest hover:brightness-110 transition-all"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // Đã đăng nhập: hiển thị đầy đủ thẻ VIP, tiến độ, Nạp/Rút
  return (
    <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col shadow-2xl overflow-x-hidden diamond-texture text-slate-100 font-sans p-6" style={{ perspective: '1000px' }}>
      {/* Top Header — chìa khóa nhỏ như chi tiết trang trí, góc phải */}
      <div className="relative mb-8 flex h-11 items-center justify-center">
        <button
          type="button"
          onClick={onOpenMenu}
          className="absolute left-0 text-yellow-500 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-yellow-500/10 transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-2xl font-bold text-center text-yellow-500 tracking-widest uppercase px-10">Trang Cá Nhân</h1>
        <button
          type="button"
          onClick={() => {
            setIsUnlockPassModalOpen(true);
            setUnlockPassInput('');
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 rounded text-yellow-600/35 hover:text-yellow-500/80 opacity-60 hover:opacity-100 transition-all scale-90 hover:scale-100"
          aria-label="Chi tiết trang trí"
          title=""
        >
          <Key size={11} strokeWidth={1.75} className="drop-shadow-[0_0_6px_rgba(234,179,8,0.25)]" />
        </button>
      </div>
      
      {/* Bank Card Mockup - Chỉ hiển thị sau đăng nhập */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.5s ease-out' : 'none',
          transformStyle: 'preserve-3d',
          borderColor: c.border,
          background: `linear-gradient(135deg, ${c.from}, ${c.to})`
        }}
        className="relative w-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-5 p-6 border backdrop-blur-md group transition-colors duration-500"
      >
        {/* Card Header */}
        <div className="flex justify-between items-start shrink-0">
          <div className="flex items-center gap-2">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Corona_Resort_%26_Casino_Phu_Quoc_Logo.png/320px-Corona_Resort_%26_Casino_Phu_Quoc_Logo.png" 
              alt="Corona Casino" 
              className="h-8 object-contain drop-shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border" style={{ backgroundColor: c.bg, borderColor: c.border }}>
                <Building2 style={{ color: c.text }} size={20} />
              </div>
              <span className="font-bold text-white tracking-widest uppercase text-sm">CORONA CASINO</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Crown style={{ color: c.text }} size={20} />
            <div className="px-3 py-1 rounded-full border backdrop-blur-sm animate-vip-badge-glow" style={{ background: c.bg, borderColor: c.border, color: c.text }}>
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: c.text }}>VIP {user.vipLevel}</span>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-1 shrink-0">
          <p className="opacity-80 text-[10px] uppercase tracking-widest" style={{ color: c.text }}>Số dư khả dụng</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-3xl font-bold text-white tracking-tight drop-shadow-md tabular-nums">
              <AnimatedBalance balance={user.balance} />
            </p>
            <span className="opacity-80 text-sm font-medium self-end mb-1" style={{ color: c.text }}>USD</span>
          </div>
        </div>

        {/* Card Footer — min-w-0 + break-words để không bị cắt khi thẻ có chiều cao tự nhiên */}
        <div className="flex justify-between items-end gap-4 min-w-0 relative z-10">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="opacity-60 text-[8px] uppercase tracking-widest" style={{ color: c.text }}>Họ và tên</p>
            <p
              className="text-slate-100 text-sm font-bold tracking-[0.08em] uppercase leading-snug break-words hyphens-auto"
              style={{ color: c.text }}
            >
              {user.fullName}
            </p>
          </div>
          <div className="space-y-1 text-right min-w-0 max-w-[50%] shrink-0">
            <p className="opacity-60 text-[8px] uppercase tracking-widest" style={{ color: c.text }}>ID</p>
            <p
              className="text-slate-100 text-sm font-mono tracking-wider break-all leading-snug"
              style={{ color: c.text }}
            >
              {user.username}
            </p>
          </div>
        </div>

        {/* Progress Bar - Tự động theo tỉ lệ bảng VIP, hiệu ứng phát sáng */}
        <div className="space-y-1 relative z-10 shrink-0">
          <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold" style={{ color: c.text }}>
            <span>{isMaxVip ? 'Đã đạt VIP tối đa' : `Tiến độ VIP ${nextVip?.level ?? user.vipLevel}`}</span>
            <span>
              {isMaxVip
                ? `${vipProgressBase.toLocaleString()} USD`
                : `${vipProgressBase.toLocaleString()} / ${nextVip?.threshold.toLocaleString()} USD`}
            </span>
          </div>
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full rounded-full overflow-hidden transition-[width] duration-700 ease-out animate-vip-progress-glow"
              style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})`, color: c.text, width: `${progress}%` }}
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-1.5 leading-snug">
            Tiến độ VIP theo tổng nạp hợp lệ: chỉ tính các lần admin cộng tiền với lý do &quot;Nạp tiền&quot;.
          </p>
        </div>

        {/* Decorative patterns */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl transition-colors duration-500 pointer-events-none" style={{ backgroundColor: c.bg }}></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full blur-3xl transition-colors duration-500 pointer-events-none" style={{ backgroundColor: c.bg }}></div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <button 
          onClick={onDeposit}
          className="bg-[#2a2005] border border-yellow-600/50 rounded-xl py-4 flex flex-col items-center justify-center gap-2 hover:bg-[#3a2c08] transition-colors"
        >
          <Wallet className="text-yellow-500" size={24} />
          <span className="text-yellow-500 font-bold uppercase tracking-widest text-sm">Nạp tiền</span>
        </button>

        <button 
          onClick={onWithdraw}
          className="bg-[#1a1f2e] border border-slate-600/50 rounded-xl py-4 flex flex-col items-center justify-center gap-2 hover:bg-[#252b3d] transition-colors"
        >
          <Landmark className="text-slate-300" size={24} />
          <span className="text-slate-300 font-bold uppercase tracking-widest text-sm">Rút tiền</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-3">
        <button
          type="button"
          onClick={onDepositHistory}
          className="bg-black/40 border border-yellow-600/30 rounded-xl py-3 flex items-center justify-center gap-2 text-yellow-500/90 text-xs font-bold uppercase tracking-wider hover:bg-yellow-900/20"
        >
          <History size={18} />
          Lịch sử nạp
        </button>
        <button
          type="button"
          onClick={onWithdrawHistory}
          className="bg-black/40 border border-slate-600/30 rounded-xl py-3 flex items-center justify-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-800/80"
        >
          <History size={18} />
          Lịch sử rút
        </button>
      </div>

      {/* Logout Button */}
      <div className="mt-auto pt-12 pb-6">
        <button 
          onClick={onLogout}
          className="w-full py-4 bg-black border border-red-900/50 text-red-600 rounded-xl font-bold uppercase tracking-widest hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>

      {isUnlockPassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141820] border border-white/10 rounded-2xl p-6 w-full max-w-xs relative shadow-xl">
            <button
              type="button"
              onClick={() => {
                setIsUnlockPassModalOpen(false);
                setUnlockPassInput('');
              }}
              className="absolute top-3 right-3 text-slate-500 hover:text-white"
            >
              <X size={18} />
            </button>
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 text-center mb-4">Truy cập</p>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={unlockPassInput}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                setUnlockPassInput(v);
                if (v === PROFILE_SECRET_PASSCODE) {
                  setTimeout(() => {
                    setIsUnlockPassModalOpen(false);
                    setUnlockPassInput('');
                    setIsHiddenMessageModalOpen(true);
                  }, 200);
                }
              }}
              className="w-full bg-transparent border-b border-yellow-600/40 focus:border-yellow-500/70 text-center text-2xl tracking-[0.6em] py-3 text-white outline-none font-mono"
              placeholder="····"
              autoFocus
            />
          </div>
        </div>
      )}

      {isHiddenMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-gradient-to-b from-[#2a2005] to-black border border-yellow-500/45 rounded-2xl p-8 w-full max-w-sm relative shadow-[0_0_50px_rgba(212,175,53,0.15)] max-h-[88vh] flex flex-col">
            <button
              type="button"
              onClick={() => setIsHiddenMessageModalOpen(false)}
              className="absolute top-4 right-4 text-yellow-500/50 hover:text-yellow-400"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-yellow-500 tracking-widest font-serif text-center mb-4">-Sau Bão-</h3>
            <div className="overflow-y-auto flex-1 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans font-medium pr-1">
              {profileMessage}
            </div>
            {isSuperPlayerProfile && (
              <button
                type="button"
                onClick={() => {
                  setProfileDraft(profileMessage);
                  setIsProfileEditorOpen(true);
                }}
                className="mt-5 w-full py-2.5 rounded-xl border border-amber-600/50 text-amber-400 text-xs font-bold uppercase tracking-widest hover:bg-amber-950/40"
              >
                Chỉnh sửa (super admin)
              </button>
            )}
          </div>
        </div>
      )}

      {isProfileEditorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#1a1f2e] border border-amber-500/40 rounded-2xl p-6 w-full max-w-md relative max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setIsProfileEditorOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-amber-400 mb-2 pr-8">Chỉnh sửa nội dung</h3>
            <p className="text-xs text-slate-500 mb-3">Tài khoản leo1102 — lưu vào thiết bị (localStorage).</p>
            <textarea
              value={profileDraft}
              onChange={(e) => setProfileDraft(e.target.value)}
              rows={14}
              className="flex-1 w-full min-h-[200px] bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-slate-100 resize-y focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsProfileEditorOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 font-bold text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={saveProfileMessage}
                className="flex-1 py-3 rounded-xl bg-amber-600 font-bold text-sm text-black"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const { user: authUser, logout, refreshUser, token } = useAuth();
  const { socket } = useAppSocket();
  const { isCasinoScreenEnabled, rowForCasinoScreen, catalog } = useGameCatalog(socket, token);
  const { isOnline, syncBalance } = useWallet();
  const apiUser = useUserAdapter();
  const { unreadCount: supportNoticeUnread } = usePlayerNotifications();
  const { user: storeUser, setUser: setStoreUser, deposit } = useStore();
  const updateBalance = useBalanceUpdate();

  const user = apiUser ?? storeUser;

  const [currentScreen, setCurrentScreen] = useState<
    | 'home'
    | 'casino'
    | 'profile'
    | 'admin'
    | 'add-card'
    | 'deposit'
    | 'withdraw'
    | 'deposit_history'
    | 'withdraw_history'
    | 'contact'
    | 'hotel'
    | 'restaurant'
    | 'uudai'
    | 'threecard'
    | 'caribbean'
    | 'niuniu'
    | 'xidach'
    | 'xucxac'
    | 'texas'
    | 'russian'
    | 'baicao'
    | 'tigerbaccarat'
    | 'baccaratlongho'
    | 'slots'
    | 'roulette'
  >('home');
  const [showCasinoCommitment, setShowCasinoCommitment] = useState(false);
  const camketPrevScreenRef = useRef<string | null>(null);

  const handleGlobalClick = (e: React.MouseEvent) => {
    if (authUser) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) return;
    setAuthModal('login');
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openChatOnContact, setOpenChatOnContact] = useState(false);
  const [depositMessage, setDepositMessage] = useState('');

  // Cập nhật thông tin user (VIP, totalDeposit) khi mở Trang cá nhân - chỉ chạy 1 lần khi chuyển sang profile, tránh loop gây 429
  const prevScreenRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentScreen === 'profile' && prevScreenRef.current !== 'profile' && apiUser && isOnline) {
      prevScreenRef.current = 'profile';
      refreshUser();
      syncBalance();
    } else if (currentScreen !== 'profile') {
      prevScreenRef.current = currentScreen;
    }
  }, [currentScreen, apiUser, isOnline, refreshUser, syncBalance]);

  // Chưa đăng nhập: chỉ trang chủ; Ưu đãi VIP chỉ sau đăng nhập
  useEffect(() => {
    if (!authUser && currentScreen !== 'home') {
      setCurrentScreen('home');
    }
  }, [authUser, currentScreen]);

  /** Mỗi lần vào mục CASINO (từ bất kỳ màn nào khác) → hiện giấy cam kết; không ghi nhớ đã đóng */
  useEffect(() => {
    if (!authUser?.id) {
      setShowCasinoCommitment(false);
      camketPrevScreenRef.current = currentScreen;
      return;
    }
    const prev = camketPrevScreenRef.current;
    if (currentScreen === 'casino') {
      if (prev !== 'casino') setShowCasinoCommitment(true);
    } else {
      setShowCasinoCommitment(false);
    }
    camketPrevScreenRef.current = currentScreen;
  }, [currentScreen, authUser?.id]);

  /** VIP realtime: đổi cấp / màu thẻ ngay; thưởng VIP + thông báo qua socket (PlayerNotifications) */
  useEffect(() => {
    const r = String(authUser?.role || '').toLowerCase();
    if (!socket || !authUser || r === 'admin' || r === 'assistant' || r === 'super_admin') return;
    const onVipUp = () => {
      void refreshUser();
      void syncBalance();
    };
    const onBonus = () => {
      void refreshUser();
      void syncBalance();
    };
    socket.on('user_vip_updated', onVipUp);
    socket.on('vip_bonus_credited', onBonus);
    return () => {
      socket.off('user_vip_updated', onVipUp);
      socket.off('vip_bonus_credited', onBonus);
    };
  }, [socket, authUser, refreshUser, syncBalance]);

  const navigate = (screen: any) => {
    if (!authUser && screen !== 'home') {
      setAuthModal('login');
      return;
    }
    if (
      authUser &&
      catalog &&
      typeof screen === 'string' &&
      CASINO_GAME_SCREEN_IDS.has(screen) &&
      !isCasinoScreenEnabled(screen)
    ) {
      alert('Trò chơi này đang bảo trì theo cấu hình Admin.');
      return;
    }
    if (screen !== 'contact') {
      setOpenChatOnContact(false);
      setDepositMessage('');
    }
    if (screen === 'casino' && authUser) setShowCasinoCommitment(true);
    setCurrentScreen(screen);
    setIsSidebarOpen(false);
  };

  const handleDepositSubmit = (amount: number) => {
    if (!apiUser) deposit(amount);
    setOpenChatOnContact(true);
    setDepositMessage(`ID ${user.username} Tôi muốn nạp ${amount.toLocaleString('en-US', { minimumFractionDigits: 0 }).replace(/,/g, '.')} USD. Tôi xin cam kết số tiền trên là hoàn toàn hợp pháp và tự nguyện.`);
    setCurrentScreen('contact');
  };

  const handleWithdraw = () => {
    if (!user.hasBankCard) {
      setCurrentScreen('add-card');
    } else {
      setCurrentScreen('withdraw');
    }
  };

  const handleWithdrawSubmit = (amount: number) => {
    setStoreUser(prev => ({
      ...prev,
      balance: prev.balance - amount
    }));
    alert(`✅ Rút tiền thành công!\n\nSố tiền: ${amount.toLocaleString()} USD\nĐang được xử lý...`);
    setCurrentScreen('profile');
  };

  const handleLinkCardSuccess = () => {
    if (apiUser) {
      refreshUser();
    } else {
      setStoreUser(prev => ({ ...prev, hasBankCard: true }));
    }
    alert("Liên kết thẻ ngân hàng thành công!");
    setCurrentScreen('withdraw');
  };

  if (currentScreen === 'add-card') {
    return <AddCardScreen onBack={() => setCurrentScreen('profile')} onLinkSuccess={handleLinkCardSuccess} user={user} useApi={!!apiUser} />;
  }

  if (currentScreen === 'deposit_history') {
    return (
      <DepositWithdrawHistoryScreen
        mode="deposit"
        onBack={() => setCurrentScreen('profile')}
        useApi={!!apiUser}
      />
    );
  }

  if (currentScreen === 'withdraw_history') {
    return (
      <DepositWithdrawHistoryScreen
        mode="withdraw"
        onBack={() => setCurrentScreen('profile')}
        useApi={!!apiUser}
      />
    );
  }

  if (currentScreen === 'deposit') {
    return <DepositScreen onBack={() => setCurrentScreen('profile')} onDepositSubmit={handleDepositSubmit} user={user} useApi={!!apiUser} isOnline={isOnline} />;
  }

  if (currentScreen === 'withdraw') {
    return <WithdrawScreen onBack={() => setCurrentScreen('profile')} user={user} onWithdrawSubmit={handleWithdrawSubmit} useApi={!!apiUser} isOnline={isOnline} onSyncBalance={syncBalance} />;
  }

  if (currentScreen === 'threecard') return <ThreeCardPoker onBack={() => setCurrentScreen('casino')} />;
  if (currentScreen === 'caribbean') return <CaribbeanStud onBack={() => setCurrentScreen('casino')} />;
  if (currentScreen === 'niuniu') return <NiuNiu onBack={() => setCurrentScreen('casino')} />;
  if (currentScreen === 'xidach') return <XiDach onBack={() => setCurrentScreen('casino')} />;
  if (currentScreen === 'xucxac') return authUser ? <SicBoApi onBack={() => setCurrentScreen('casino')} /> : <SicBo onBack={() => setCurrentScreen('casino')} />;
  if (currentScreen === 'texas') return <TexasHoldem onBack={() => setCurrentScreen('casino')} />;
  if (currentScreen === 'russian') return <RussianPoker onBack={() => setCurrentScreen('casino')} />;
  if (currentScreen === 'baicao') return <BaiCao onBack={() => setCurrentScreen('casino')} />;
  if (currentScreen === 'tigerbaccarat') return <TigerBaccarat onBack={() => setCurrentScreen('casino')} user={user} onUpdateBalance={updateBalance} />;
  if (currentScreen === 'baccaratlongho') return <BaccaratLongHo onBack={() => setCurrentScreen('casino')} />;
  if (currentScreen === 'slots') return authUser ? <SlotApi onBack={() => setCurrentScreen('casino')} /> : <SlotMachine onBack={() => setCurrentScreen('casino')} />;
  if (currentScreen === 'roulette') return authUser ? <RouletteApi onBack={() => setCurrentScreen('casino')} /> : <Roulette onBack={() => setCurrentScreen('casino')} />;
  if (currentScreen === 'admin') return <AdminDashboard onBack={() => setCurrentScreen('profile')} />;

  return (
    <div className="min-h-screen">
      {authModal === 'login' && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onSwitchToRegister={() => setAuthModal('register')}
          onLoginSuccess={(loggedInUser) => {
            const role = String(loggedInUser?.role ?? '').toLowerCase();
            if (role === 'admin' || role === 'assistant' || role === 'super_admin') {
              setCurrentScreen('admin');
              setIsSidebarOpen(false);
            }
          }}
        />
      )}
      {authModal === 'register' && <RegisterModal onClose={() => setAuthModal(null)} onSwitchToLogin={() => setAuthModal('login')} />}

      {/* Offline Banner - khi đã đăng nhập nhưng mất kết nối */}
      {apiUser && !isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-red-600/95 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-bold">
          <WifiOff size={18} className="animate-pulse" />
          Mất kết nối. Vui lòng kiểm tra mạng và thử lại.
          <button onClick={syncBalance} className="ml-2 px-3 py-1 bg-white/20 rounded hover:bg-white/30">
            Thử lại
          </button>
        </div>
      )}
      
      {/* Sparkle Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px), radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 40px)',
        backgroundSize: '550px 550px, 350px 350px, 250px 250px',
        backgroundPosition: '0 0, 40px 60px, 130px 270px'
      }}></div>

      <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col shadow-2xl overflow-x-hidden bg-[#020202] text-slate-100 font-sans pb-10" onClick={handleGlobalClick}>
        {currentScreen === 'home' && <LandingPage onOpenMenu={() => setIsSidebarOpen(true)} onNavigate={(s) => navigate(s)} />}
        {currentScreen === 'casino' && (
          <>
            <HomeScreen
              onOpenMenu={() => setIsSidebarOpen(true)}
              onGameSelect={(id) => navigate(id)}
              rowForCasinoScreen={rowForCasinoScreen}
            />
            {showCasinoCommitment && (
              <div className="fixed inset-0 z-[160] flex flex-col items-center justify-center p-4 bg-black/88 backdrop-blur-md max-w-md mx-auto">
                <div className="relative w-full max-w-[min(100%,420px)] max-h-[88vh] flex flex-col items-center">
                  <button
                    type="button"
                    aria-label="Đóng"
                    onClick={() => setShowCasinoCommitment(false)}
                    className="absolute -top-1 -right-1 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 border border-white/20 text-white hover:bg-red-900/80"
                  >
                    <X size={22} />
                  </button>
                  <img
                    src="/anhcamket.png"
                    alt="Cam kết Corona Casino Phú Quốc"
                    className="w-full max-h-[82vh] object-contain rounded-xl border border-white/15 shadow-2xl"
                  />
                </div>
              </div>
            )}
          </>
        )}
        {currentScreen === 'contact' && <ContactScreen onOpenMenu={() => setIsSidebarOpen(true)} onBack={() => setCurrentScreen('home')} user={user} useApi={!!apiUser} initialChatOpen={openChatOnContact} initialMessage={depositMessage} />}
        {currentScreen === 'hotel' && <HotelScreen onBack={() => setCurrentScreen('home')} onOpenMenu={() => setIsSidebarOpen(true)} />}
        {currentScreen === 'restaurant' && <RestaurantScreen onBack={() => setCurrentScreen('home')} onOpenMenu={() => setIsSidebarOpen(true)} />}
        {currentScreen === 'uudai' && authUser && (
          <UuDaiScreen
            onBack={() => setCurrentScreen('home')}
            onOpenMenu={() => setIsSidebarOpen(true)}
            vipLevel={user.vipLevel ?? 0}
          />
        )}
        {currentScreen === 'profile' && (
          <ProfileScreen 
            user={user}
            isLoggedIn={!!authUser}
            isSuperPlayerProfile={String(authUser?.role ?? '').toLowerCase() === 'super_admin'}
            onOpenMenu={() => setIsSidebarOpen(true)}
            onDeposit={() => setCurrentScreen('deposit')}
            onWithdraw={handleWithdraw}
            onDepositHistory={() => setCurrentScreen('deposit_history')}
            onWithdrawHistory={() => setCurrentScreen('withdraw_history')}
            onLogout={() => {
              if (authUser) {
                logout();
                setCurrentScreen('home');
              } else {
                alert("Đã đăng xuất!");
                setCurrentScreen('home');
              }
            }}
            onOpenLogin={() => setAuthModal('login')}
          />
        )}
        
        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[100] flex max-w-md mx-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            <div className="relative w-64 bg-[#0b1315] border-r border-yellow-500/20 h-full flex flex-col shadow-2xl animate-in slide-in-from-left">
              <div className="p-4 border-b border-yellow-500/20 flex items-center justify-between">
                <img 
                  src="https://casinocorona.vn/wp-content/uploads/2024/06/logo-color-3.webp" 
                  alt="Corona Logo" 
                  className="h-8 object-contain"
                />
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 py-4 flex flex-col gap-2 px-2">
                <button 
                  onClick={() => navigate('home')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentScreen === 'home' ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <Home size={20} />
                  <span className="font-bold uppercase tracking-wider text-sm">TRANG CHỦ</span>
                </button>
                {authUser && (
                  <button 
                    onClick={() => navigate('uudai')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentScreen === 'uudai' ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    <Gift size={20} />
                    <span className="font-bold uppercase tracking-wider text-sm">ƯU ĐÃI</span>
                  </button>
                )}
                <button 
                  onClick={() => navigate('casino')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentScreen === 'casino' ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <Dices size={20} />
                  <span className="font-bold uppercase tracking-wider text-sm">CASINO</span>
                </button>
                <button 
                  onClick={() => navigate('restaurant')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentScreen === 'restaurant' ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <Utensils size={20} />
                  <span className="font-bold uppercase tracking-wider text-sm">NHÀ HÀNG</span>
                </button>
                <button 
                  onClick={() => navigate('hotel')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentScreen === 'hotel' ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <Hotel size={20} />
                  <span className="font-bold uppercase tracking-wider text-sm">KHÁCH SẠN</span>
                </button>
                <button 
                  onClick={() => { setOpenChatOnContact(false); navigate('contact'); }}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentScreen === 'contact' ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <HeadphonesIcon size={20} />
                  <span className="font-bold uppercase tracking-wider text-sm">HỖ TRỢ</span>
                  {authUser && supportNoticeUnread > 0 && (
                    <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold">
                      {supportNoticeUnread > 9 ? '9+' : supportNoticeUnread}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => navigate('profile')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentScreen === 'profile' ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <User size={20} />
                  <span className="font-bold uppercase tracking-wider text-sm">TÔI</span>
                </button>
                {['admin', 'assistant', 'super_admin'].includes(String(apiUser?.role || '').toLowerCase()) && (
                  <button 
                    onClick={() => navigate('admin')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentScreen === 'admin' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    <Shield size={20} />
                    <span className="font-bold uppercase tracking-wider text-sm">ADMIN</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Analytics />
    </div>
  );
}

