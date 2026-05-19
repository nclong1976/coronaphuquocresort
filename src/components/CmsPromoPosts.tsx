import React from 'react';

type BaseKey = 'marketing.hotel' | 'marketing.restaurant' | 'marketing.uudai';

/** Hiển thị tối đa 2 bài quảng bá từ SiteContent (super chỉnh trong CMS) */
export function CmsPromoPosts({ c, baseKey }: { c: Record<string, string>; baseKey: BaseKey }) {
  const posts = [
    { t: `${baseKey}.postTitle`, img: `${baseKey}.postImageUrl`, b: `${baseKey}.postBody` },
    { t: `${baseKey}.post2Title`, img: `${baseKey}.post2ImageUrl`, b: `${baseKey}.post2Body` },
  ];
  const blocks = posts.filter((p) => (c[p.t] || c[p.img] || c[p.b] || '').trim().length > 0);
  if (blocks.length === 0) return null;
  return (
    <div className="px-4 space-y-4 mb-6">
      {blocks.map((p, i) => (
        <article key={i} className="bg-yellow-900/15 border border-yellow-500/25 rounded-2xl overflow-hidden shadow-lg">
          {c[p.img]?.trim() ? (
            <div className="aspect-video overflow-hidden">
              <img src={c[p.img]!.trim()} alt="" className="w-full h-full object-cover" />
            </div>
          ) : null}
          <div className="p-4 space-y-2">
            {c[p.t]?.trim() ? <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wide">{c[p.t]}</h3> : null}
            {c[p.b]?.trim() ? (
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{c[p.b]}</p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
