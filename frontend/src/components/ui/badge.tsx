import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'muted';
}

export function Badge({ label, variant = 'default', className, ...props }: BadgeProps) {
  return (
    <View
      className={cn(
        'self-start px-2.5 py-1 rounded-full',
        variant === 'default' && 'bg-primary/10',
        variant === 'success' && 'bg-success/10',
        variant === 'warning' && 'bg-warning/10',
        variant === 'destructive' && 'bg-destructive/10',
        variant === 'muted' && 'bg-muted',
        className,
      )}
      {...props}
    >
      <Text
        variant="small"
        className={cn(
          'font-semibold',
          variant === 'default' && 'text-primary',
          variant === 'success' && 'text-success',
          variant === 'warning' && 'text-warning',
          variant === 'destructive' && 'text-destructive',
          variant === 'muted' && 'text-muted-foreground',
        )}
      >
        {label}
      </Text>
    </View>
  );
}
