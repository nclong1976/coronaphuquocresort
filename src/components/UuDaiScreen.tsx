/**
 * ƯU ĐÃI — Luồng người chơi sau đăng nhập: giao diện VIP từ module ƯU ĐÃI (vuốt cấp, đặc quyền, điều khoản).
 */
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Menu, Gift } from 'lucide-react';
import { resolveApiBase } from '../api/resolveApiBase';
import { mergeAllSiteContent } from '../constants/landingContentDefaults';
import { CmsPromoPosts } from './CmsPromoPosts';
import { VipPromotionsPanel } from './uudai/VipPromotionsPanel';

export function UuDaiScreen({
  onBack,
  onOpenMenu,
  vipLevel,
}: {
  onBack: () => void;
  onOpenMenu: () => void;
  /** Cấp VIP hiện tại từ tài khoản (0–10) */
  vipLevel: number;
}) {
  const [cms, setCms] = useState(() => mergeAllSiteContent({}));
  useEffect(() => {
    fetch(`${resolveApiBase()}/api/site-content`)
      .then((r) => r.json())
      .then((d: { content?: Record<string, string> }) => setCms(mergeAllSiteContent(d.content || {})))
      .catch(() => {});
  }, []);

  return (
    <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col shadow-2xl overflow-hidden bg-[#0b1315] text-slate-100 font-sans">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-black/90 backdrop-blur-md px-4 py-3 border-b border-yellow-500/20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={onOpenMenu} className="text-slate-300 hover:text-white transition-colors shrink-0">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Gift className="text-yellow-500 shrink-0" size={22} />
            <h1 className="text-base sm:text-lg font-bold text-yellow-500 uppercase tracking-widest truncate">Ưu đãi</h1>
          </div>
        </div>
        <button type="button" onClick={onBack} className="text-slate-400 hover:text-white transition-colors shrink-0">
          <ArrowLeft size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        <CmsPromoPosts c={cms} baseKey="marketing.uudai" />
        <VipPromotionsPanel playerVipLevel={vipLevel} />
      </div>
    </div>
  );
}
