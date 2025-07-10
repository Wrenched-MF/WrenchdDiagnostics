import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EnhancedCardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'solid';
  interactive?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export function EnhancedCard({
  title,
  description,
  icon,
  children,
  className = '',
  variant = 'default',
  interactive = false,
  loading = false,
  onClick
}: EnhancedCardProps) {
  const variantClasses = {
    default: 'bg-white/10 border-white/20 backdrop-blur-sm',
    glass: 'bg-white/5 border-white/10 backdrop-blur-md',
    gradient: 'bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-sm',
    solid: 'bg-gray-900/80 border-gray-700'
  };

  const baseClasses = cn(
    variantClasses[variant],
    interactive && 'cursor-pointer hover:bg-white/15 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
    'relative overflow-hidden',
    className
  );

  const cardContent = (
    <>
      {loading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10 backdrop-blur-sm">
          <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
        </div>
      )}
      
      {(title || description || icon) && (
        <CardHeader className={cn(icon && 'flex flex-row items-center space-y-0 space-x-3')}>
          {icon && (
            <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1">
            {title && (
              <CardTitle className="text-white text-lg font-semibold">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-white/70 text-sm">
                {description}
              </CardDescription>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn(!(title || description || icon) && 'pt-6')}>
        {children}
      </CardContent>
    </>
  );

  if (onClick) {
    return (
      <Card className={baseClasses} onClick={onClick}>
        {cardContent}
      </Card>
    );
  }

  return (
    <Card className={baseClasses}>
      {cardContent}
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'orange' | 'red';
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  color = 'blue',
  loading = false
}: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-600/20 to-blue-800/20 border-blue-500/30',
    green: 'from-green-600/20 to-green-800/20 border-green-500/30',
    yellow: 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/30',
    orange: 'from-orange-600/20 to-orange-800/20 border-orange-500/30',
    red: 'from-red-600/20 to-red-800/20 border-red-500/30'
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    red: 'text-red-400'
  };

  if (loading) {
    return (
      <Card className={cn('bg-gradient-to-br', colorClasses[color], 'backdrop-blur-sm animate-pulse')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-white/10 rounded w-20" />
          <div className="h-4 w-4 bg-white/10 rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-white/10 rounded w-16 mb-2" />
          <div className="h-3 bg-white/5 rounded w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'bg-gradient-to-br', 
      colorClasses[color], 
      'backdrop-blur-sm hover:scale-105 transition-transform duration-200'
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/80">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn('h-4 w-4', iconColorClasses[color])}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && (
          <p className="text-xs text-white/60 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            'text-xs mt-1 flex items-center',
            trend.isPositive ? 'text-green-400' : 'text-red-400'
          )}>
            <span className="mr-1">{trend.isPositive ? '↗' : '↘'}</span>
            {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}