import React from 'react';

interface FoxLogoProps {
  customLogoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const FoxLogo: React.FC<FoxLogoProps> = ({ customLogoUrl, size = 'md', className = '' }) => {
  if (customLogoUrl && customLogoUrl.trim() !== '') {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-11 w-11',
      lg: 'h-16 w-16',
      xl: 'h-24 w-24'
    };
    return (
      <img
        src={customLogoUrl}
        alt="FOX CODES"
        className={`${sizeClasses[size]} object-contain rounded-xl drop-shadow-[0_0_12px_rgba(168,85,247,0.6)] ${className}`}
      />
    );
  }

  const dimensions = {
    sm: { w: 32, h: 32 },
    md: { w: 44, h: 44 },
    lg: { w: 64, h: 64 },
    xl: { w: 96, h: 96 }
  }[size];

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/60 via-[#18112e] to-black p-1.5 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(192,132,252,0.6)] ${className}`}
      style={{ width: dimensions.w, height: dimensions.h }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_8px_#c084fc]"
      >
        {/* Geometric luxury Fox head */}
        <polygon points="50,15 15,45 28,88 50,72 72,88 85,45" fill="url(#foxGrad)" stroke="#c084fc" strokeWidth="2" strokeLinejoin="round" />
        {/* Left ear */}
        <polygon points="20,40 10,12 38,28" fill="#581c87" stroke="#a855f7" strokeWidth="1.5" />
        <polygon points="18,34 13,17 32,26" fill="#9333ea" />
        {/* Right ear */}
        <polygon points="80,40 90,12 62,28" fill="#581c87" stroke="#a855f7" strokeWidth="1.5" />
        <polygon points="82,34 87,17 68,26" fill="#9333ea" />
        {/* Forehead & center muzzle */}
        <polygon points="50,15 35,45 50,65 65,45" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" />
        {/* Glowing Eyes */}
        <polygon points="32,48 44,48 38,55" fill="#f43f5e" filter="drop-shadow(0 0 4px #fb7185)" />
        <polygon points="68,48 56,48 62,55" fill="#f43f5e" filter="drop-shadow(0 0 4px #fb7185)" />
        {/* Nose / Snout */}
        <polygon points="50,68 44,76 56,76" fill="#c084fc" />
        {/* Cheeks */}
        <polygon points="15,45 35,45 28,88" fill="#2e1065" stroke="#9333ea" strokeWidth="1" />
        <polygon points="85,45 65,45 72,88" fill="#2e1065" stroke="#9333ea" strokeWidth="1" />
        {/* Gradient */}
        <defs>
          <linearGradient id="foxGrad" x1="15" y1="15" x2="85" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6b21a8" />
            <stop offset="0.5" stopColor="#3b0764" />
            <stop offset="1" stopColor="#1e113a" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
