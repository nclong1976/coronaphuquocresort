import React from 'react';

export function VipBanner({
  gradient,
  name,
  onNext,
  onPrev,
}: {
  gradient: string;
  name: string;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <section
      className="relative overflow-hidden py-8 bg-cover bg-center"
      style={{
        backgroundImage: `url('https://cdn2.net.hr/media/2021/09/08/459071/H-41339380-10ab-11ec-968f-c236887b7c8a-760.webp?1744083763')`,
      }}
    >
      <div
        className={`flex items-center justify-center relative w-72 h-40 mx-auto rounded-2xl border border-white/30 shadow-lg overflow-hidden bg-cover bg-center ${
          name === 'VIP 9' || name === 'VIP 10' ? 'ring-4 ring-white/70 shadow-2xl shadow-white/20' : ''
        }`}
        style={{
          backgroundImage: `url('https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRYEdN7s_BKdzMt7eXMe09hJIzD5Q7afdlIuIcpi1Qi65YLnTel')`,
        }}
      >
        <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${gradient} absolute mix-blend-overlay`} />
        <div className="absolute bottom-3 left-4 text-white text-2xl font-black tracking-tighter uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          {name}
        </div>
        {(name === 'VIP 9' || name === 'VIP 10') && (
          <>
            <div className={`absolute top-4 left-4 text-white animate-pulse ${name === 'VIP 10' ? 'text-2xl' : 'text-xl'}`}>✦</div>
            <div className={`absolute top-8 right-8 text-white animate-pulse delay-75 ${name === 'VIP 10' ? 'text-3xl' : 'text-2xl'}`}>✦</div>
            <div className={`absolute bottom-10 right-4 text-white animate-pulse delay-150 ${name === 'VIP 10' ? 'text-2xl' : 'text-xl'}`}>✦</div>
            {name === 'VIP 10' && (
              <div className="absolute top-10 left-10 text-white animate-pulse delay-300 text-xl">✦</div>
            )}
          </>
        )}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-5xl sm:text-6xl font-bold opacity-80 cursor-pointer drop-shadow-md hover:opacity-100 transition-opacity z-10 px-2"
        aria-label="Cấp trước"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-5xl sm:text-6xl font-bold opacity-80 cursor-pointer drop-shadow-md hover:opacity-100 transition-opacity z-10 px-2"
        aria-label="Cấp sau"
      >
        ›
      </button>
    </section>
  );
}
