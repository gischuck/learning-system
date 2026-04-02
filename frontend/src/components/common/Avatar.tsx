import React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xlarge';
  color?: string;
  className?: string;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'busy';
}

const sizeStyles = {
  xs: 'w-6 h-6 text-xs',
  small: 'w-8 h-8 text-sm',
  medium: 'w-10 h-10 text-base',
  large: 'w-12 h-12 text-lg',
  xlarge: 'w-16 h-16 text-xl',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
};

export function Avatar({
  name,
  src,
  size = 'medium',
  color = '#3B82F6',
  className,
  showStatus = false,
  status = 'online',
}: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className={cn('relative inline-flex', className)}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={cn(
            'rounded-full object-cover',
            sizeStyles[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center text-white font-semibold',
            sizeStyles[size]
          )}
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white',
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{
    name?: string;
    src?: string;
    color?: string;
  }>;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'small',
  className,
}: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          name={avatar.name}
          src={avatar.src}
          size={size}
          color={avatar.color}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-medium ring-2 ring-white',
            sizeStyles[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
