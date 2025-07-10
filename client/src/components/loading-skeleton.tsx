import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'table' | 'dashboard' | 'form';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = 'card', count = 1, className = '' }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (variant === 'dashboard') {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <div className="h-10 bg-white/5 rounded-lg w-64 mx-auto animate-pulse" />
          <div className="h-6 bg-white/5 rounded-lg w-96 mx-auto animate-pulse" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-white/5 rounded w-20" />
                <div className="h-8 bg-white/5 rounded w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader className="animate-pulse">
                <div className="h-6 bg-white/5 rounded w-32" />
                <div className="h-4 bg-white/5 rounded w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {skeletons.map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
              <div className="w-10 h-10 bg-white/10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
              <div className="w-20 h-6 bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="animate-pulse">
          <div className="h-10 bg-white/10 rounded-lg mb-4" />
          {skeletons.map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg mb-2" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={`space-y-6 ${className}`}>
        {skeletons.map((i) => (
          <div key={i} className="animate-pulse space-y-4">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-12 bg-white/5 rounded-lg" />
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <div className="h-10 bg-white/10 rounded w-24 animate-pulse" />
          <div className="h-10 bg-white/5 rounded w-20 animate-pulse" />
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`space-y-4 ${className}`}>
      {skeletons.map((i) => (
        <Card key={i} className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader className="animate-pulse">
            <div className="h-6 bg-white/5 rounded w-32 mb-2" />
            <div className="h-4 bg-white/5 rounded w-48" />
          </CardHeader>
          <CardContent className="animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-5/6" />
              <div className="h-4 bg-white/5 rounded w-4/6" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LoadingSpinner({ size = 'default', className = '' }: { size?: 'sm' | 'default' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin border-4 border-green-500 border-t-transparent rounded-full ${sizeClasses[size]} ${className}`} />
  );
}