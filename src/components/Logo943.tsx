import React from 'react';

interface Logo943Props {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo943: React.FC<Logo943Props> = ({ 
  size = 'md',
  showSubtitle = true 
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  return (
    <div className="flex items-center gap-2.5 shrink-0 group">
      {/* Custom Geometric Architectural Crest Logo */}
      <div 
        className={`${iconSizes[size]} relative rounded-xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-0.5 shadow-xs border border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden transition-transform group-hover:scale-105 duration-200`}
      >
        {/* Subtle background ambient grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415515_1px,transparent_1px),linear-gradient(to_bottom,#33415515_1px,transparent_1px)] bg-[size:6px_6px] pointer-events-none" />

        {/* Vector Emblem for Floor 9 · Room 43 */}
        <svg 
          viewBox="0 0 36 36" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          {/* High-Rise Tower Outline with Floor 9 accent */}
          <rect x="5" y="4" width="26" height="28" rx="4" fill="#0B132B" stroke="#334155" strokeWidth="1.2" />
          
          {/* Kuwait flag micro-accent strip on top */}
          <rect x="9" y="7" width="18" height="2" rx="1" fill="#10B981" />
          
          {/* Floor grid windows */}
          <rect x="9" y="11" width="3" height="3" rx="0.75" fill="#475569" />
          <rect x="14" y="11" width="3" height="3" rx="0.75" fill="#475569" />
          <rect x="19" y="11" width="3" height="3" rx="0.75" fill="#475569" />
          <rect x="24" y="11" width="3" height="3" rx="0.75" fill="#475569" />

          {/* Highlighted 9th Floor (Glowing Emerald Window Row) */}
          <rect x="9" y="16" width="3" height="3" rx="0.75" fill="#34D399" />
          <rect x="14" y="16" width="3" height="3" rx="0.75" fill="#34D399" />
          <rect x="19" y="16" width="3" height="3" rx="0.75" fill="#34D399" />
          <rect x="24" y="16" width="3" height="3" rx="0.75" fill="#34D399" />

          {/* Room 43 Crest Text Plaque */}
          <rect x="7" y="21" width="22" height="9" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />
          <text 
            x="18" 
            y="27.5" 
            textAnchor="middle" 
            fill="#FFFFFF" 
            fontFamily="JetBrains Mono, monospace" 
            fontWeight="800" 
            fontSize="6.5" 
            letterSpacing="0.2"
          >
            9.43
          </text>
        </svg>

        {/* Live green indicator jewel */}
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
      </div>

      {/* Typography Brand Lockup - Only Name */}
      <span className="font-extrabold text-slate-900 text-base sm:text-lg leading-none tracking-tight font-mono-num">
        9.43
      </span>
    </div>
  );
};
