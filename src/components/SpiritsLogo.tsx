import React from 'react';

interface SpiritsLogoProps {
  className?: string;
}

export default function SpiritsLogo({ className = "w-full h-full" }: SpiritsLogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      id="spirits-logo-vector"
    >
      <defs>
        {/* Core Gradients */}
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" /> {/* purple-500 */}
          <stop offset="100%" stopColor="#4f46e5" /> {/* indigo-600 */}
        </linearGradient>
        <linearGradient id="ghostGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e9d5ff" /> {/* purple-200 */}
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d8b4fe" /> {/* purple-300 */}
          <stop offset="50%" stopColor="#818cf8" /> {/* indigo-400 */}
          <stop offset="100%" stopColor="#a78bfa" /> {/* purple-400 */}
        </linearGradient>
        {/* Glow Filter for Spiritual Aura */}
        <filter id="ghostGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Background Crest / Shield */}
      <path 
        d="M50 5 L85 20 V55 C85 75 70 90 50 95 C30 90 15 75 15 55 V20 L50 5 Z" 
        fill="url(#shieldGrad)" 
        stroke="#a78bfa" 
        strokeWidth="1.5"
      />

      {/* 2. Abstract Spiritual Energy / Glowing Flame Ring */}
      <circle 
        cx="50" 
        cy="52" 
        r="28" 
        stroke="#f472b6" 
        strokeWidth="2" 
        strokeDasharray="4 8" 
        opacity="0.8"
        filter="url(#ghostGlow)"
      />

      {/* 3. TCG Card Silhouette behind the Ghost */}
      <rect 
        x="36" 
        y="30" 
        width="28" 
        height="40" 
        rx="3" 
        fill="url(#cardGrad)" 
        transform="rotate(-10 50 50)" 
        stroke="#ffffff" 
        strokeWidth="1"
        opacity="0.9"
        filter="url(#ghostGlow)"
      />

      {/* 4. The "Spirits" Ghost emerging from the card */}
      <path 
        d="M50 25 
           C38 25, 32 35, 32 48 
           C32 55, 35 60, 38 63 
           C41 65, 43 62, 45 59 
           C47 56, 53 56, 55 59 
           C57 62, 59 65, 62 63 
           C65 60, 68 55, 68 48 
           C68 35, 62 25, 50 25 Z" 
        fill="url(#ghostGrad)" 
        filter="url(#ghostGlow)"
      />

      {/* 5. Glowing Eyes (Red/Pink for competitive spirit) */}
      <ellipse cx="44" cy="42" rx="3" ry="4" fill="#ec4899" />
      <ellipse cx="56" cy="42" rx="3" ry="4" fill="#ec4899" />
      
      {/* Glint of determination in the eyes */}
      <circle cx="45" cy="41" r="1" fill="#ffffff" />
      <circle cx="57" cy="41" r="1" fill="#ffffff" />

      {/* Wicked cute smile */}
      <path 
        d="M45 50 Q50 54 55 50" 
        stroke="#475569" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        fill="none"
      />
    </svg>
  );
}
