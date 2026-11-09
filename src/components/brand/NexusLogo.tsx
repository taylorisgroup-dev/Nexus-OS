import React, { useState } from 'react';

interface NexusLogoProps {
  variant?: 'header' | 'sidebar' | 'cockpit' | 'document' | 'auth' | 'large';
  showSubtext?: boolean;
  className?: string;
  imageSrc?: string;
}

export const OFFICIAL_LOGO_PATH = '/assets/aistudio/Logo_NEXUS_en_m_tal_avec_ADN_color__2f6462d3.png';

export const NexusLogo: React.FC<NexusLogoProps> = ({
  variant = 'header',
  className = '',
  imageSrc,
}) => {
  const [imageError, setImageError] = useState(false);
  const src = imageSrc || OFFICIAL_LOGO_PATH;

  // Sizing definitions tuned for the official wide metallic logo
  const sizeClasses = {
    header: 'h-8 sm:h-9 max-w-[170px] sm:max-w-[190px]',
    sidebar: 'h-10 sm:h-11 max-w-[210px]',
    cockpit: 'h-14 sm:h-16 max-w-[280px]',
    auth: 'h-16 sm:h-20 max-w-[320px]',
    large: 'h-20 sm:h-24 max-w-[360px]',
    document: 'h-10 max-w-[200px]',
  }[variant];

  if (!imageError) {
    return (
      <div
        className={`relative inline-flex items-center justify-start select-none group ${className}`}
        title="NEXUS Premium Solutions · Ingénierie d'affaires & Digitalisation"
      >
        {/* Subtle dual-color ambient glow behind the logo */}
        <div
          aria-hidden="true"
          className="absolute -inset-1 rounded-xl bg-gradient-to-r from-red-600/15 via-transparent to-blue-600/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm pointer-events-none"
        />

        <img
          src={src}
          alt="NEXUS Premium Solutions"
          onError={() => setImageError(true)}
          className={`relative z-10 w-auto object-contain transition-transform duration-200 ${sizeClasses}`}
        />
      </div>
    );
  }

  // Vector Fallback with exact red & blue DNA double helix and metallic typography
  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      aria-label="NEXUS Premium Solutions"
    >
      <svg
        className={variant === 'header' ? 'w-6 h-6' : variant === 'auth' ? 'w-10 h-10' : 'w-8 h-8'}
        viewBox="0 0 60 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="redHelixG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
          <linearGradient id="blueHelixG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
        </defs>
        <path
          d="M 16 10 C 34 26, 44 42, 30 52 C 16 62, 16 78, 44 94"
          stroke="url(#redHelixG)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 44 10 C 16 26, 16 42, 30 52 C 44 62, 44 78, 16 94"
          stroke="url(#blueHelixG)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="flex flex-col">
        <span className="font-extrabold tracking-wider text-white text-base">
          NE<span className="text-red-500">X</span><span className="text-blue-500">U</span>S
        </span>
        <span className="text-[8px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
          PREMIUM SOLUTIONS
        </span>
      </div>
    </div>
  );
};
