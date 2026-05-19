import React from 'react';
import { motion } from 'motion/react';

interface ChipProps {
  value: string | number;
  color: string;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const Chip: React.FC<ChipProps> = ({ value, color, isSelected, onClick, size = 'md' }) => {
  const sizeClasses = {
    sm: 'size-10 text-[8px]',
    md: 'size-12 text-[10px]',
    lg: 'size-14 text-[12px]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1, y: -5 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`
        ${sizeClasses[size]} rounded-full ${color} 
        border-4 border-dashed border-white/40 
        flex items-center justify-center shadow-2xl 
        relative overflow-hidden transition-all
        ${isSelected ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-black scale-110 z-10' : 'opacity-80 hover:opacity-100'}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/20"></div>
      <div className="absolute inset-1 border border-white/20 rounded-full"></div>
      <span className="text-white font-black drop-shadow-md z-10">{value}</span>
    </motion.button>
  );
};
