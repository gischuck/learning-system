import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium';
  className?: string;
  dot?: boolean;
  dotColor?: string;
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-cyan-100 text-cyan-700',
};

const sizeStyles = {
  small: 'text-xs px-2 py-0.5',
  medium: 'text-sm px-2.5 py-0.5',
};

export function Badge({
  children,
  variant = 'default',
  size = 'medium',
  className,
  dot = false,
  dotColor,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: dotColor || 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  active: { label: '进行中', variant: 'primary' },
  completed: { label: '已完成', variant: 'success' },
  pending: { label: '待开始', variant: 'default' },
  'in-progress': { label: '进行中', variant: 'info' },
  high: { label: '高优先级', variant: 'danger' },
  medium: { label: '中优先级', variant: 'warning' },
  low: { label: '低优先级', variant: 'success' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'default' as const };
  return (
    <Badge variant={config.variant} size="small" className={className}>
      {config.label}
    </Badge>
  );
}
