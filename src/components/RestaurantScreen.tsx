import React, { useEffect, useState } from 'react';
import { ArrowLeft, Utensils, MapPin, Phone, Mail, Menu } from 'lucide-react';
import { motion } from 'motion/react';
import { resolveApiBase } from '../api/resolveApiBase';
import { mergeAllSiteContent } from '../constants/landingContentDefaults';
import { CmsPromoPosts } from './CmsPromoPosts';

const RESTAURANTS = [
  {
    name: 'Corona Food Center',
    image: 'https://casinocorona.vn/wp-content/uploads/2023/06/food-center-1024x684.jpg',
    description: 'Trung tâm ẩm thực đa dạng với các món ăn từ nhiều nền văn hóa khác nhau, phục vụ nhu cầu phong phú của thực khách.'
  },
  {
    name: 'Casino Food & Bar',
    image: 'https://casinocorona.vn/wp-content/uploads/2023/06/ellipse-bar-3-1024x683.jpg',
    description: 'Không gian ẩm thực và quầy bar sang trọng ngay bên trong Casino, nơi bạn có thể thưởng thức đồ uống và món ăn nhẹ đẳng cấp.'
  }
];

const DEFAULT_REST_BANNER = 'https://casinocorona.vn/wp-content/uploads/2022/09/almaz-phu-quoc-1_1629996299.jpg';

const DEFAULT_REST_INTRO =
  'Trải nghiệm hành trình ẩm thực đa sắc màu tại Corona Resort & Casino. Từ những món ăn truyền thống Việt Nam đến tinh hoa ẩm thực thế giới, tất cả đều được chuẩn bị bởi những đầu bếp hàng đầu.';

export function RestaurantScreen({ onBack, onOpenMenu }: { onBack: () => void; onOpenMenu: () => void }) {
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
          <h1 className="text-lg font-bold text-yellow-500 uppercase tracking-widest">Nhà Hàng</h1>
        </div>
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {/* Banner */}
        <div className="relative w-full aspect-video overflow-hidden">
          <img
            src={(cms['marketing.restaurant.heroUrl'] || '').trim() || DEFAULT_REST_BANNER}
            alt="Corona Restaurant Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1315] via-transparent to-black/40"></div>
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <h2 className="text-2xl font-bold text-white uppercase tracking-[0.2em]">ẨM THỰC</h2>
          </div>
        </div>

        {/* Intro Text */}
        <div className="p-6">
          <p className="text-slate-300 text-sm leading-relaxed text-center whitespace-pre-wrap">
            {(cms['marketing.restaurant.intro'] || '').trim() || DEFAULT_REST_INTRO}
          </p>
        </div>

        <CmsPromoPosts c={cms} baseKey="marketing.restaurant" />

        {/* Restaurant List */}
        <div className="px-4 space-y-6">
          {RESTAURANTS.map((res, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-xl group"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img 
                  src={res.image} 
                  alt={res.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-yellow-500 uppercase mb-2">{res.name}</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-4">{res.description}</p>
                <button className="w-full py-2 bg-yellow-600/20 border border-yellow-600/50 text-yellow-500 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-yellow-600/30 transition-colors">
                  Xem thêm
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
