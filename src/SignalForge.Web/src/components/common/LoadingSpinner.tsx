import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizes = { sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-10 h-10' };

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative">
        <div className={`${sizes[size]} border-2 border-accent/20 rounded-full`} />
        <Loader2 className={`${sizes[size]} text-accent animate-spin absolute inset-0`} />
      </div>
      {text && <p className="text-sm text-text-muted animate-pulse">{text}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-shimmer rounded-lg ${className ?? 'h-4 w-full'}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-1.5 flex-1" />
        <Skeleton className="h-1.5 flex-1" />
        <Skeleton className="h-1.5 flex-1" />
      </div>
    </div>
  );
}
