import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 w-full animate-pulse">
      {/* Table header skeleton */}
      <div className="h-10 bg-neutral-800/60 rounded-lg w-full" />
      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-12 bg-neutral-900/50 border border-neutral-800/80 rounded-lg flex items-center px-4 gap-4"
        >
          <div className="h-4 bg-neutral-800 rounded w-1/4" />
          <div className="h-4 bg-neutral-800 rounded w-1/4" />
          <div className="h-4 bg-neutral-800 rounded w-1/6" />
          <div className="h-4 bg-neutral-800 rounded w-1/6 ml-auto" />
        </div>
      ))}
    </div>
  );
};
