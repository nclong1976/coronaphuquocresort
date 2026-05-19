/**
 * Tự động đọc màu thẻ VIP từ bangvip.html.
 * Khi cập nhật public/bangvip.html, màu thẻ trong app sẽ thay đổi theo.
 */
import { useState, useEffect } from 'react';

export interface VipColorSet {
  from: string;
  to: string;
  border: string;
  text: string;
  bg: string;
}

/** VIP0–10: silver → gold luxury (fallback nếu không parse được bangvip.html) */
const FALLBACK_COLORS: Record<number, VipColorSet> = {
  0: { from: '#e8eaed', to: '#5c5f66', border: 'rgba(140,145,155,0.55)', text: '#ffffff', bg: 'rgba(140,145,155,0.22)' },
  1: { from: '#dbeafe', to: '#3d5a80', border: 'rgba(61,90,128,0.55)', text: '#ffffff', bg: 'rgba(61,90,128,0.22)' },
  2: { from: '#f5e0c8', to: '#b87333', border: 'rgba(184,115,51,0.55)', text: '#ffffff', bg: 'rgba(184,115,51,0.22)' },
  3: { from: '#d4fc79', to: '#22c55e', border: 'rgba(34,197,94,0.55)', text: '#0a1f0f', bg: 'rgba(34,197,94,0.2)' },
  4: { from: '#a78bfa', to: '#6366f1', border: 'rgba(99,102,241,0.6)', text: '#ffffff', bg: 'rgba(99,102,241,0.25)' },
  5: { from: '#fcd9a3', to: '#c27b1a', border: 'rgba(194,123,26,0.55)', text: '#ffffff', bg: 'rgba(194,123,26,0.22)' },
  6: { from: '#c4b5fd', to: '#6d28d9', border: 'rgba(109,40,217,0.6)', text: '#ffffff', bg: 'rgba(109,40,217,0.25)' },
  7: { from: '#6ee7b7', to: '#047857', border: 'rgba(4,120,87,0.55)', text: '#ffffff', bg: 'rgba(4,120,87,0.22)' },
  8: { from: '#fecaca', to: '#dc2626', border: 'rgba(220,38,38,0.55)', text: '#ffffff', bg: 'rgba(220,38,38,0.22)' },
  9: { from: '#a5f3fc', to: '#0d9488', border: 'rgba(13,148,136,0.55)', text: '#ffffff', bg: 'rgba(13,148,136,0.22)' },
  10: { from: '#fff9e6', to: '#d4af37', border: 'rgba(212,175,55,0.65)', text: '#1a1408', bg: 'rgba(212,175,55,0.28)' },
};

function parseBangVipHtml(html: string): Record<number, VipColorSet> {
  const result: Record<number, VipColorSet> = {};
  const regex = /\.vip(\d+)\s*\{[^}]*background:\s*linear-gradient\([^,]+,([^,]+),([^)]+)\)/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const level = parseInt(m[1], 10);
    const from = m[2].trim();
    const to = m[3].trim();
    const toRgb = hexToRgba(to, 0.6);
    const toBg = hexToRgba(to, 0.2);
    const textColor = isDark(to) ? '#ffffff' : '#1a1a1a';
    result[level] = { from, to, border: toRgb, text: textColor, bg: toBg };
  }
  return result;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length < 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function isDark(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.6;
}

export function useVipColors(): Record<number, VipColorSet> {
  const [colors, setColors] = useState<Record<number, VipColorSet>>(FALLBACK_COLORS);

  useEffect(() => {
    const url = '/bangvip.html';
    fetch(url)
      .then((res) => res.text())
      .then((html) => {
        const parsed = parseBangVipHtml(html);
        if (Object.keys(parsed).length >= 11) {
          setColors((prev) => ({ ...prev, ...parsed }));
        }
      })
      .catch(() => {});
  }, []);

  return colors;
}

export function getVipStyles(colors: VipColorSet) {
  return {
    background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
    borderColor: colors.border,
    color: colors.text,
  };
}
