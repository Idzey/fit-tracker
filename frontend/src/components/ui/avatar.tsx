import * as React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const letter = name.charAt(0).toUpperCase();
  return (
    <View
      className={cn(
        'bg-primary rounded-full items-center justify-center',
        size === 'sm' && 'w-8 h-8',
        size === 'md' && 'w-10 h-10',
        size === 'lg' && 'w-20 h-20',
        className,
      )}
    >
      <Text
        className={cn(
          'text-primary-foreground font-bold',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-3xl',
        )}
      >
        {letter}
      </Text>
    </View>
  );
}
