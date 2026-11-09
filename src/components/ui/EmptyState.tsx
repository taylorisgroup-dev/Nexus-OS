import React from 'react';
import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-neutral-800 rounded-xl bg-neutral-900/30">
      <div className="p-3 bg-neutral-800/80 rounded-lg text-neutral-300 mb-4 border border-neutral-700/50">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-medium text-neutral-200">{title}</h3>
      <p className="mt-1 text-sm text-neutral-400 max-w-md leading-relaxed">{description}</p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-4 py-2 text-xs font-medium text-neutral-950 bg-neutral-100 hover:bg-white rounded-lg transition-colors shadow-xs"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
