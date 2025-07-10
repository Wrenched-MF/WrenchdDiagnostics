import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'wouter';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <Link href="/">
        <span className="flex items-center text-white/60 hover:text-white transition-colors cursor-pointer">
          <Home className="w-4 h-4" />
        </span>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 text-white/40" />
          {item.href && index < items.length - 1 ? (
            <Link href={item.href}>
              <span className="flex items-center space-x-1 text-white/60 hover:text-white transition-colors cursor-pointer">
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </span>
            </Link>
          ) : (
            <span className="flex items-center space-x-1 text-green-400 font-medium">
              {item.icon && <item.icon className="w-4 h-4" />}
              <span>{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}