import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div
    className={cn('animate-pulse rounded-md bg-muted', className)}
    {...props}
  />
);

export const TaskListSkeleton: React.FC = () => (
  <div className="space-y-6">
    {[1, 2].map(i => (
      <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="flex items-center px-4 py-3 bg-muted/30 border-b border-border">
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="divide-y divide-border">
          {[1, 2, 3].map(j => (
            <div key={j} className="flex items-center gap-3 p-3 sm:p-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 flex-1" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const AgendaSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-baseline gap-2">
          <Skeleton className="h-8 w-10" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2].map(j => (
            <Skeleton key={j} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const MealsSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-baseline gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="p-4">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);
