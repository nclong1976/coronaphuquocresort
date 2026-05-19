import React from 'react';
import { motion } from 'motion/react';

interface DealerProps {
  name?: string;
  status?: string;
  message?: string;
}

export const Dealer: React.FC<DealerProps> = ({ 
  name = "Isabella", 
  status = "Online", 
  message = "Chào mừng quý khách!" 
}) => {
  return (
    <div className="flex flex-col items-center justify-center pt-16 pb-4">
      <div className="relative">
        {/* Dealer Avatar Container */}
        <div className="relative w-24 h-24 rounded-full border-2 border-yellow-500/50 p-1 bg-black/40 backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          <img 
            src="https://picsum.photos/seed/dealer/200/200" 
            alt="Dealer" 
            className="w-full h-full rounded-full object-cover grayscale-[0.2] contrast-[1.1]"
            referrerPolicy="no-referrer"
          />
          {/* Online Indicator */}
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
        </div>
        
        {/* Name Tag */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full shadow-lg">
          <span className="text-[10px] font-black text-black uppercase tracking-tighter">{name}</span>
        </div>
      </div>

      {/* Status & Message */}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-bold text-yellow-500/80 uppercase tracking-widest">{status}</span>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/5 shadow-xl"
        >
          <p className="text-[11px] font-medium text-white/90 italic tracking-tight">"{message}"</p>
        </motion.div>
      </div>
    </div>
  );
};
