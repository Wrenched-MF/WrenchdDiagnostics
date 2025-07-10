import { ReactNode, TouchEvent, useState } from 'react';
import { cn } from '@/lib/utils';

interface TouchButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

export function TouchButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
    outline: 'border-white/20 text-white hover:bg-white/10 bg-transparent',
    ghost: 'text-white hover:bg-white/10 bg-transparent border-transparent'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[44px]', // 44px is Apple's recommended minimum touch target
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!disabled && !loading) {
      setIsPressed(true);
      // Add haptic feedback for supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      className={cn(
        'relative overflow-hidden font-medium transition-all duration-200',
        'border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400/50',
        'active:scale-95 select-none touch-manipulation',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        isPressed && 'scale-95 brightness-110',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Ripple effect */}
      <span className="absolute inset-0 bg-white/20 transform scale-0 rounded-lg transition-transform duration-300 group-active:scale-100" />
      
      <span className="relative z-10 flex items-center justify-center space-x-2">
        {children}
      </span>
    </button>
  );
}

interface TouchCardProps {
  children: ReactNode;
  onTap?: () => void;
  className?: string;
  interactive?: boolean;
}

export function TouchCard({
  children,
  onTap,
  className = '',
  interactive = false
}: TouchCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    if (interactive || onTap) {
      setIsPressed(true);
      if ('vibrate' in navigator) {
        navigator.vibrate(5);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    if (onTap) {
      onTap();
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        'bg-white/10 border border-white/20 backdrop-blur-sm rounded-lg',
        interactive || onTap ? 'cursor-pointer select-none touch-manipulation' : '',
        interactive || onTap ? 'hover:bg-white/15 active:scale-98' : '',
        isPressed && 'scale-98 brightness-110',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

interface SwipeableProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  className?: string;
}

export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
  className = ''
}: SwipeableProps) {
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (startX !== null) {
      setCurrentX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (startX !== null && currentX !== null) {
      const deltaX = currentX - startX;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    }
    
    setStartX(null);
    setCurrentX(null);
  };

  return (
    <div
      className={cn('select-none touch-manipulation', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// Hook for detecting tablet/mobile devices
export function useTabletDetection() {
  const isTablet = () => {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const screenWidth = window.innerWidth;
    
    // Tablet-specific detection
    const isTabletDevice = 
      /ipad/.test(userAgent) ||
      (/android/.test(userAgent) && !/mobile/.test(userAgent)) ||
      (isTouch && screenWidth >= 768 && screenWidth <= 1024);
    
    return {
      isTablet: isTabletDevice,
      isTouch,
      screenWidth,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    };
  };

  return isTablet();
}