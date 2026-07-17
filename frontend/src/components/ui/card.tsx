'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  animate = true,
  glow = false,
  onClick,
}: CardProps) {
  const containerClass = `
    glass-panel rounded-[12px] p-6 transition-all duration-300
    ${glow ? 'glass-panel-glow' : ''}
    ${onClick ? 'cursor-pointer hover:border-brand-violet/40 hover:bg-brand-card-light' : ''}
    ${className}
  `;

  if (!animate) {
    return (
      <div className={containerClass} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={onClick ? { y: -4, scale: 1.01 } : undefined}
      className={containerClass}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
export default Card;
