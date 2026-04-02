import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
  onClick?: () => void;
}

const paddingMap = {
  none: '',
  small: 'p-3',
  medium: 'p-4',
  large: 'p-6',
};

const shadowMap = {
  none: '',
  small: 'shadow-sm',
  medium: 'shadow-md',
  large: 'shadow-lg',
};

export function Card({
  children,
  className,
  padding = 'medium',
  shadow = 'small',
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200',
        paddingMap[padding],
        shadowMap[shadow],
        hover && 'hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('', className)}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('flex items-center justify-between mt-4 pt-4 border-t border-gray-100', className)}>
      {children}
    </div>
  );
}
