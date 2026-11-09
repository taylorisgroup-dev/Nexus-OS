import React, { useState } from 'react';
import { NexusLogo } from './NexusLogo';

interface NexusBannerProps {
  title?: string;
  subtitle?: string;
  showMotto?: boolean;
  className?: string;
  imageSrc?: string;
}

export const NexusBanner: React.FC<NexusBannerProps> = ({
  title,
  subtitle,
  showMotto = true,
  className = '',
  imageSrc = '/banner-nexus.png',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 p-6 sm:p-8 ${className}`}
      style={{
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* If external banner image is available, display it as background */}
      {!imageError && imageSrc && (
        <img
          src={imageSrc}
          alt="NEXUS Dark Atmosphere"
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-screen pointer-events-none transition-opacity duration-700 ${
            imageLoaded ? 'opacity-35' : 'opacity-0'
          }`}
        />
      )}

      {/* Atmospheric Neon Lighting: Blue on left, Red on right (matching ChatGPT Image 23 août 2026) */}
      <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-to-r from-blue-600/15 via-blue-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l from-red-600/15 via-red-500/5 to-transparent pointer-events-none" />

      {/* Carbon diagonal textures */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #000 0px, #000 4px, #333 4px, #333 5px)',
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <NexusLogo variant="large" showSubtext={true} />

          {title && (
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white pt-2">
              {title}
            </h2>
          )}

          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {showMotto && (
          <div className="p-4 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl text-xs space-y-1.5 md:text-right shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block font-semibold">
              ADN NEXUS
            </span>
            <p className="text-white font-mono tracking-tight font-bold text-xs">
              « THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »
            </p>
            <p className="text-neutral-400 text-[11px] italic">
              « L’entreprise d’abord. La technologie ensuite. »
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
