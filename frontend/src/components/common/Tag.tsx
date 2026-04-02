import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TagProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'small' | 'medium';
}

const sizeStyles = {
  small: 'text-xs px-2 py-0.5',
  medium: 'text-sm px-2.5 py-1',
};

export function Tag({
  children,
  color = '#3B82F6',
  className,
  removable = false,
  onRemove,
  onClick,
  size = 'small',
}: TagProps) {
  const bgColor = `${color}20`;
  const textColor = color;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
        sizeStyles[size],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      onClick={onClick}
    >
      {children}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70 transition-opacity"
        >
          <X size={size === 'small' ? 12 : 14} />
        </button>
      )}
    </span>
  );
}

interface TagGroupProps {
  tags: Array<{ id: string; name: string; color?: string }>;
  max?: number;
  className?: string;
}

export function TagGroup({ tags, max = 3, className }: TagGroupProps) {
  const displayTags = tags.slice(0, max);
  const remaining = tags.length - max;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displayTags.map((tag) => (
        <Tag key={tag.id} color={tag.color}>
          {tag.name}
        </Tag>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-gray-500 px-1">+{remaining}</span>
      )}
    </div>
  );
}

