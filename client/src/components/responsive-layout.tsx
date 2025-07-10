import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveLayout({ 
  children, 
  className = '', 
  maxWidth = '7xl',
  padding = 'md'
}: ResponsiveLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900',
      paddingClasses[padding],
      className
    )}>
      <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}

export function PageHeader({ title, subtitle, icon, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="space-y-6">
      {breadcrumb && (
        <div className="mb-4">
          {breadcrumb}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {icon && (
            <div className="p-3 bg-green-500/20 rounded-lg">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/70 text-sm sm:text-base lg:text-lg mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface GridLayoutProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GridLayout({ children, columns = 1, gap = 'md', className = '' }: GridLayoutProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={cn(
      'grid',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}