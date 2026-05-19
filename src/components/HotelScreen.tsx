import React, { useEffect, useState } from 'react';
import { ArrowLeft, Star, MapPin, Phone, Mail, Menu } from 'lucide-react';
import { motion } from 'motion/react';
import { resolveApiBase } from '../api/resolveApiBase';
import { mergeAllSiteContent } from '../constants/landingContentDefaults';
import { CmsPromoPosts } from './CmsPromoPosts';

const HOTELS = [
  {
    name: 'Radisson Blu Resort Phu Quoc',
    stars: 5,
    image: 'https://casinocorona.vn/wp-content/uploads/2022/08/z3456271154787_9e208f89337c3e1ea745dff5b1058391-scaled.jpg',
    description: 'Khu nghỉ dưỡng tiêu chuẩn 5 sao quốc tế với không gian sang trọng và dịch vụ đẳng cấp.'
  },
  {
    name: 'Wyndham Grand Phu Quoc',
    stars: 5,
    image: 'https://casinocorona.vn/wp-content/uploads/2024/06/wyndham-grand2.jpg',
    description: 'Trải nghiệm nghỉ dưỡng thượng lưu với hệ thống phòng nghỉ hiện đại và tiện ích phong phú.'
  },
  {
    name: 'Wyndham Garden GrandWorld',
    stars: 4,
    image: 'https://casinocorona.vn/wp-content/uploads/2023/04/wydham-garden-phu-quoc-web.jpg',
    description: 'Không gian xanh mát, gần gũi với thiên nhiên ngay tại trung tâm giải trí Grand World.'
  },
  {
    name: 'VinHolidays Fiesta Phu Quoc',
    stars: 4,
    image: 'https://casinocorona.vn/wp-content/uploads/2022/10/77f13db2325ef043d92a740cc551e1f8.webp',
    description: 'Lựa chọn hoàn hảo cho kỳ nghỉ năng động với thiết kế trẻ trung và tiện nghi.'
  }
];

const DEFAULT_HOTEL_BANNER =
  'https://casinocorona.vn/wp-content/uploads/2022/08/corona-hotel-Hotel-06-compress.jpg';

const DEFAULT_HOTEL_INTRO =
  'Tọa lạc tại Bãi Dài Phú Quốc – Bãi biển được tạp chí Forbes bình chọn là 1 trong 6 bãi biển đẹp nhất hành tinh, Corona cung cấp dịch vụ nghỉ dưỡng tiêu chuẩn 5 sao với hơn 3,000 phòng nghỉ, biệt thự ven biển, dịch vụ giải trí, ẩm thực ngay trong resort cùng đội ngũ nhân viên tận tình.';

export function HotelScreen({ onBack, onOpenMenu }: { onBack: () => void; onOpenMenu: () => void }) {
  const [cms, setCms] = useState(() => mergeAllSiteContent({}));
  useEffect(() => {
    fetch(`${resolveApiBase()}/api/site-content`)
      .then((r) => r.json())
      .then((d: { content?: Record<string, string> }) => setCms(mergeAllSiteContent(d.content || {})))
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
          <h1 className="text-lg font-bold text-yellow-500 uppercase tracking-widest">Khách Sạn</h1>
        </div>
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {/* Banner */}
        <div className="relative w-full aspect-video overflow-hidden">
          <img
            src={(cms['marketing.hotel.heroUrl'] || '').trim() || DEFAULT_HOTEL_BANNER}
            alt="Corona Hotel Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1315] via-transparent to-black/40"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight leading-tight">
              NGHỈ DƯỠNG TẠI CORONA – SỰ KẾT HỢP LƯU TRÚ HOÀN HẢO
            </h2>
          </div>
        </div>

        {/* Intro Text */}
        <div className="p-6">
          <p className="text-slate-300 text-sm leading-relaxed text-justify whitespace-pre-wrap">
            {(cms['marketing.hotel.intro'] || '').trim() || DEFAULT_HOTEL_INTRO}
          </p>
        </div>

        <CmsPromoPosts c={cms} baseKey="marketing.hotel" />

        {/* Hotel List */}
        <div className="px-4 space-y-6">
          {HOTELS.map((hotel, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-xl"
            >
              <div className="relative aspect-[16/9]">
                <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-0.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full">
                  {[...Array(hotel.stars)].map((_, i) => (
                    <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-yellow-500 uppercase mb-2">{hotel.name}</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-4">{hotel.description}</p>
                <button className="w-full py-2 bg-yellow-600/20 border border-yellow-600/50 text-yellow-500 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-yellow-600/30 transition-colors">
                  Xem chi tiết
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-10 p-6 bg-black/60 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3 text-slate-400">
            <MapPin size={18} className="text-yellow-500" />
            <span className="text-xs">Khu Bãi Dài, Đặc khu Phú Quốc, tỉnh Kiên Giang, Việt Nam</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <Phone size={18} className="text-yellow-500" />
            <span className="text-xs">+84 297 222 8888</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <Mail size={18} className="text-yellow-500" />
            <span className="text-xs">mkt.management@casinocorona.vn</span>
          </div>
        </div>
      </main>
    </div>
  );
}
