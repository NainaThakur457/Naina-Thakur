import React from 'react';

interface CapClipLogoProps {
  variant?: 'icon' | 'horizontal' | 'full';
  size?: number | string;
  className?: string;
  glow?: boolean;
}

export default function CapClipLogo({
  variant = 'horizontal',
  size,
  className = '',
  glow = true,
}: CapClipLogoProps) {
  // SVG sizes mapping
  const widthClass = size ? '' : variant === 'icon' ? 'w-12 h-12' : variant === 'horizontal' ? 'w-48 h-10' : 'w-64 h-64';
  const customStyle = size ? { width: size, height: typeof size === 'number' ? `${size}px` : size } : {};

  // Beautiful SVG elements representing the C film ribbon, play button, and shadows
  const renderIcon = () => (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Film Ribbon core gradient */}
        <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e879f9" /> {/* Rich Magenta */}
          <stop offset="50%" stopColor="#a855f7" /> {/* Royal Violet */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Electric Cyan */}
        </linearGradient>

        {/* Play Button matching gradient */}
        <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" /> {/* Pink */}
          <stop offset="50%" stopColor="#a855f7" /> {/* Violet */}
          <stop offset="100%" stopColor="#38bdf8" /> {/* Light Blue */}
        </linearGradient>

        {/* Drop shadow filter for realism */}
        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#8b5cf6" floodOpacity="0.25" />
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
        </filter>

        <linearGradient id="innerGlow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0891b2" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Outer Glow filter layer */}
      {glow && (
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="url(#ribbonGrad)"
          opacity="0.12"
          filter="blur(16px)"
        />
      )}

      <g filter="url(#logoShadow)">
        {/* Main "C" Film Reel Ribbon Path */}
        {/* Sweeping elegant circular boundary with offset end points to match the 3D spiral logo */}
        <path
          d="M 142 48 
             A 72 72 0 1 0 142 152 
             C 120 180, 80 180, 52 152
             C 24 124, 24 76, 52 48
             C 74 26, 115 30, 142 48 Z"
          fill="url(#ribbonGrad)"
          fillRule="evenodd"
        />

        {/* Dark film ribbon overlay containing sprocket segment holes */}
        <path
          d="M 124 58
             A 54 54 0 1 0 124 142
             C 110 160, 80 160, 62 142
             C 44 124, 44 76, 62 58
             C 78 42, 108 42, 124 58 Z"
          fill="#09090b"
          opacity="0.95"
        />

        {/* Highlight inner spiral border */}
        <path
          d="M 124 58
             A 54 54 0 1 0 124 142"
          stroke="url(#innerGlow)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Simulated Film Sprocket Holes (Individual rounded rectangle vectors aligned along core path curve) */}
        {/* Left curve alignment coordinates */}
        <rect x="52" y="58" width="8" height="12" rx="2" transform="rotate(-40, 56, 64)" fill="#09090b" stroke="url(#ribbonGrad)" strokeWidth="0.8" />
        <rect x="38" y="76" width="8" height="12" rx="2" transform="rotate(-15, 42, 82)" fill="#09090b" stroke="url(#ribbonGrad)" strokeWidth="0.8" />
        <rect x="36" y="98" width="8" height="12" rx="2" transform="rotate(10, 40, 104)" fill="#09090b" stroke="url(#ribbonGrad)" strokeWidth="0.8" />
        <rect x="42" y="118" width="8" height="12" rx="2" transform="rotate(35, 46, 124)" fill="#09090b" stroke="url(#ribbonGrad)" strokeWidth="0.8" />
        <rect x="56" y="136" width="8" height="12" rx="2" transform="rotate(60, 60, 142)" fill="#09090b" stroke="url(#ribbonGrad)" strokeWidth="0.8" />
        
        {/* Bright cyan accent sweep wrapping around the lower jaw */}
        <path
          d="M 80 168 
             C 114 168, 144 142, 144 108
             C 144 104, 140 100, 136 102
             C 132 104, 128 112, 124 116
             C 112 128, 94 136, 76 132
             C 68 130, 64 134, 66 142
             C 70 158, 74 168, 80 168 Z"
          fill="#38bdf8"
          opacity="0.85"
        />

        {/* Float Central Right-pointing Play Button with soft corners */}
        <path
          d="M 94 72
             C 91 70, 87 72, 87 76
             L 87 124
             C 87 128, 91 130, 94 128
             L 128 104
             C 131 102, 131 98, 128 96
             Z"
          fill="url(#playGrad)"
        />
        
        {/* Soft white reflection flare on the play button */}
        <path
          d="M 90 80 L 90 120 L 115 100 Z"
          fill="#ffffff"
          opacity="0.15"
        />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`shrink-0 ${widthClass} ${className}`} style={customStyle}>
        {renderIcon()}
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-2.5 h-10 select-none ${className}`} style={customStyle}>
        <div className="w-8 h-8 shrink-0">
          {renderIcon()}
        </div>
        <div className="text-left flex flex-col justify-center">
          <div className="flex items-baseline font-sans">
            <span className="text-base font-black text-white tracking-tight uppercase">cap</span>
            <span className="text-base font-black tracking-tight uppercase bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">clip</span>
          </div>
          <span className="text-[6.5px] font-bold text-zinc-500 uppercase tracking-[0.2em] -mt-0.5 leading-none">
            Edit • Create • Inspire
          </span>
        </div>
      </div>
    );
  }

  // Large complete mock card view matches the user's beautiful picture!
  return (
    <div className={`flex flex-col items-center text-center p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md select-none ${className} max-w-sm`} style={customStyle}>
      {/* Dynamic Render Logo Box */}
      <div className="w-36 h-36 mb-6">
        {renderIcon()}
      </div>

      {/* Wordmark capclip */}
      <div className="flex items-center justify-center font-sans mb-1 text-3xl font-extrabold tracking-tight">
        <span className="text-white">cap</span>
        <span className="bg-gradient-to-r from-[#ca8a04] via-[#ca8a04] to-[#ca8a04] text-[#a855f7] bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">clip</span>
      </div>

      {/* Tagline */}
      <div className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-8 font-sans">
        EDIT <span className="text-purple-500">•</span> CREATE <span className="text-purple-500">•</span> INSPIRE
      </div>

      {/* Powered by Google Studio */}
      <div className="flex items-center justify-center gap-1.5 border-t border-white/5 pt-4 w-full text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-sans">
        <span>Powered by</span>
        
        {/* Google Flat colored icon logo */}
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current inline-block">
          <path
            d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.56-1.56 2.95-3.24 3.51v2.9h5.1c3.07-2.83 4.8-7 4.8-11.89c0-.62-.06-1.21-.17-1.75Z"
            fill="#4285F4"
          />
          <path
            d="M12.18 20.5c2.75 0 5.07-.91 6.77-2.46l-5.1-2.9c-1.39.95-3.18 1.48-5.02 1.48c-3.87 0-7.13-2.61-8.3-6.13H1.87v3h8.31c2.08 3.5 5.2 7.01 2 7.01Z"
            fill="#34A853"
          />
          <path
            d="M3.88 10.49a6.9 6.9 0 0 1 0-4.38v-3H1.87a11.9 11.9 0 0 0 0 10.38l2.01-3Z"
            fill="#FBBC05"
          />
          <path
            d="M12.18 3.5c1.92 0 3.65.66 5 1.92l3.43-3.43A11.8 11.8 0 0 0 12.18 0C7.38 0 3.26 2.76 1.87 6.11l2.01 3c1.17-3.52 4.43-6.11 8.3-6.11Z"
            fill="#EA4335"
          />
        </svg>

        <span className="text-zinc-400 font-bold capitalize tracking-normal">Google Studio</span>
      </div>
    </div>
  );
}
