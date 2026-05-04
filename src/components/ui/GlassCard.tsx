import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, gradient = false }) => {
  return (
    <div
      className={cn(
        'backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden',
        gradient && 'bg-gradient-to-br from-white/20 to-white/5',
        className
      )}
    >
      {children}
    </div>
  );
};
