import React, { useEffect, useState } from 'react';
import { 
  ArrowRight, 
  Play, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Menu,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  Dices,
  Utensils,
  Hotel,
  History
} from 'lucide-react';
import { motion } from 'motion/react';
import { resolveApiBase } from '../api/resolveApiBase';
import { mergeAllSiteContent } from '../constants/landingContentDefaults';

interface LandingPageProps {
  onOpenMenu: () => void;
  onNavigate: (screen: any) => void;
}

export function LandingPage({ onOpenMenu, onNavigate }: LandingPageProps) {
  const [c, setC] = useState(() => mergeAllSiteContent({}));

  useEffect(() => {
    const base = resolveApiBase();
    fetch(`${base}/api/site-content`)
      .then((r) => r.json())
      .then((d: { content?: Record<string, string> }) => setC(mergeAllSiteContent(d.content || {})))
      .catch(() => {});
  }, []);

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
            className="h-8 object-contain ml-2"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {/* Hero Video Section */}
        <section className="relative w-full aspect-video bg-black overflow-hidden">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover opacity-80"
            src={c['landing.heroVideoUrl']}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1315] via-transparent to-black/40"></div>
        </section>

        {/* About Us Section */}
        <section className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-[0.3em]">{c['landing.aboutKicker']}</span>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{c['landing.aboutTitle']}</h2>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl border border-white/10">
            <img 
              src={c['landing.aboutImageUrl']}
              alt="Corona Resort" 
              className="w-full h-full object-cover"
            />
          </div>

          <p className="text-slate-300 text-sm leading-relaxed text-justify whitespace-pre-wrap">{c['landing.aboutParagraph']}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center">
              <span className="text-2xl font-black text-yellow-500">{c['landing.statRooms']}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Phòng nghỉ & Villa</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center">
              <span className="text-2xl font-black text-yellow-500">{c['landing.statRestaurants']}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nhà hàng & Bar</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center">
              <span className="text-2xl font-black text-yellow-500">{c['landing.statCasino']}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Casino hợp pháp</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center">
              <span className="text-2xl font-black text-yellow-500">{c['landing.statGolf']}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Sân Golf Quốc tế</span>
            </div>
          </div>
        </section>

        {/* Notifications / News */}
        <section className="px-4 space-y-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl overflow-hidden p-4 flex flex-col items-center text-center space-y-3">
            <AlertTriangle size={32} className="text-red-500" />
            <h3 className="text-sm font-bold text-red-500 uppercase">{c['landing.alertTitle']}</h3>
            <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{c['landing.alertBody']}</p>
            <button className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              Xem chi tiết <ChevronRight size={14} />
            </button>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl overflow-hidden group">
            <div className="aspect-video overflow-hidden">
              <img 
                src={c['landing.promoImageUrl']}
                alt="Khách Việt trở lại" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-bold text-yellow-500 uppercase">{c['landing.promoTitle']}</h3>
              <p className="text-xs text-slate-400 whitespace-pre-wrap">{c['landing.promoBody']}</p>
            </div>
          </div>
        </section>

        {(c['marketing.home.postTitle'] || c['marketing.home.postImageUrl'] || c['marketing.home.postBody']) &&
        (c['marketing.home.postTitle']?.trim() || c['marketing.home.postImageUrl']?.trim() || c['marketing.home.postBody']?.trim()) && (
          <section className="px-4 pb-6">
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl overflow-hidden">
              {c['marketing.home.postImageUrl']?.trim() ? (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={c['marketing.home.postImageUrl'].trim()}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}
              <div className="p-4 space-y-2">
                {c['marketing.home.postTitle']?.trim() ? (
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">{c['marketing.home.postTitle'].trim()}</h3>
                ) : null}
                {c['marketing.home.postBody']?.trim() ? (
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{c['marketing.home.postBody']}</p>
                ) : null}
              </div>
            </div>
          </section>
        )}

        {/* Luxury Stay Section */}
        <section className="mt-10 space-y-6">
          <div className="px-6 space-y-2">
            <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-[0.3em]">Luxury Stay</span>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">NGHỈ DƯỠNG THƯỢNG LƯU</h2>
          </div>

          <div className="flex overflow-x-auto gap-4 px-6 no-scrollbar">
            {[
              { name: 'Radisson Blu', img: 'https://casinocorona.vn/wp-content/uploads/2022/08/z3456271154787_9e208f89337c3e1ea745dff5b1058391-scaled.jpg' },
              { name: 'Wyndham Grand', img: 'https://casinocorona.vn/wp-content/uploads/2024/06/wyndham-grand2.jpg' },
              { name: 'Wyndham Garden', img: 'https://casinocorona.vn/wp-content/uploads/2023/04/wydham-garden-phu-quoc-web.jpg' }
            ].map((hotel, i) => (
              <div key={i} className="min-w-[280px] bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="aspect-[16/10]">
                  <img src={hotel.img} alt={hotel.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="font-bold text-yellow-500 uppercase text-sm">{hotel.name}</span>
                  <button onClick={() => onNavigate('hotel')} className="text-slate-400 hover:text-white">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6">
            <button 
                onClick={() => onNavigate('hotel')}
                className="w-full py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
            >
                Xem tất cả khách sạn <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Food Section */}
        <section className="mt-10 space-y-6">
          <div className="px-6 space-y-2">
            <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-[0.3em]">Gastronomy</span>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">HỆ THỐNG ẨM THỰC</h2>
          </div>

          <div className="px-6 grid grid-cols-1 gap-4">
            <div 
                onClick={() => onNavigate('restaurant')}
                className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer"
            >
              <img src="https://casinocorona.vn/wp-content/uploads/2023/06/food-center-1024x684.jpg" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                <span className="text-white font-bold uppercase tracking-widest">Corona Food Center</span>
              </div>
            </div>
            <div 
                onClick={() => onNavigate('restaurant')}
                className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer"
            >
              <img src="https://casinocorona.vn/wp-content/uploads/2023/06/ellipse-bar-3-1024x683.jpg" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                <span className="text-white font-bold uppercase tracking-widest">Casino Food & Bar</span>
              </div>
            </div>
          </div>
        </section>

        {/* Casino Section */}
        <section className="mt-10 relative py-10 overflow-hidden">
          <div className="absolute inset-0">
            <img src="https://casinocorona.vn/wp-content/uploads/2024/04/noi_that_casino-scaled.jpg" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b1315] via-transparent to-[#0b1315]"></div>
          </div>
          
          <div className="relative z-10 px-6 text-center space-y-6">
            <div className="space-y-2">
              <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-[0.3em]">Corona Casino</span>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">NƠI VẬN MAY ĐÓN CHỜ!</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Thử thách vận may và tìm kiếm những điều bất ngờ tại Casino Corona Phú Quốc. Trải nghiệm hàng loạt tiện nghi sang trọng, đẳng cấp hàng đầu thế giới.
            </p>
            <button 
                onClick={() => onNavigate('casino')}
                className="metallic-gold text-black px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              Vào Sảnh Casino
            </button>
          </div>
        </section>

        {/* Utilities Slider */}
        <section className="mt-10 space-y-6">
          <div className="px-6 space-y-2">
            <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-[0.3em]">Entertainment</span>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">VUI CHƠI GIẢI TRÍ</h2>
          </div>

          <div className="flex overflow-x-auto gap-4 px-6 no-scrollbar">
            {[
              { name: 'Convention Center', img: 'https://casinocorona.vn/wp-content/uploads/2024/04/ball-room.jpg' },
              { name: 'VinWonders', img: 'https://casinocorona.vn/wp-content/uploads/2024/04/vinwonder.jpg' },
              { name: 'Nhà hát Corona', img: 'https://casinocorona.vn/wp-content/uploads/2024/04/theater.jpg' },
              { name: 'Naia Spa', img: 'https://casinocorona.vn/wp-content/uploads/2024/04/span.jpg' },
              { name: 'Vinpearl Safari', img: 'https://casinocorona.vn/wp-content/uploads/2024/04/safari.jpg' }
            ].map((item, i) => (
              <div key={i} className="min-w-[200px] aspect-[4/5] relative rounded-2xl overflow-hidden shadow-xl border border-white/10">
                <img src={item.img} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-4">
                  <span className="text-white font-bold uppercase text-[10px] tracking-widest">{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="mt-10 p-6 space-y-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest text-center">HÌNH ẢNH</h2>
          <div className="grid grid-cols-2 gap-2">
            <img src="https://casinocorona.vn/wp-content/uploads/2025/09/cong-vip2-1024x681.jpg" className="rounded-lg aspect-square object-cover border border-white/10" />
            <img src="https://casinocorona.vn/wp-content/uploads/2023/03/slot-machine-1024x683.jpg" className="rounded-lg aspect-square object-cover border border-white/10" />
            <img src="https://casinocorona.vn/wp-content/uploads/2022/10/IMG_9654-1-1024x678.jpg" className="rounded-lg aspect-square object-cover border border-white/10" />
            <img src="https://casinocorona.vn/wp-content/uploads/2022/10/IMG_9731-1024x672.jpg" className="rounded-lg aspect-square object-cover border border-white/10" />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 p-8 bg-black/60 border-t border-yellow-500/20 space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <img 
              src="https://casinocorona.vn/wp-content/uploads/2024/01/Corona_Logo_Color-1024x895.png" 
              className="h-20 object-contain"
            />
            <div className="flex gap-4">
              <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400"><Mail size={20} /></div>
              <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400"><Phone size={20} /></div>
              <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400"><MapPin size={20} /></div>
            </div>
          </div>

          <div className="space-y-4 text-slate-400 text-xs">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-yellow-500 shrink-0" />
              <span>Khu Bãi Dài, Đặc khu Phú Quốc, tỉnh Kiên Giang, Việt Nam</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-yellow-500 shrink-0" />
              <span>+84 297 222 8888</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-yellow-500 shrink-0" />
              <span>mkt.management@casinocorona.vn</span>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Copyright 2026 © Corona Resort & Casino.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
