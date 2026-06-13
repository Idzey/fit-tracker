import * as React from 'react';
import { View as RNView, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

interface ViewUIProps extends ViewProps {
  variant?: 'default' | 'card' | 'muted';
}

export function View({ className, variant = 'default', ...props }: ViewUIProps) {
  return (
    <RNView
      className={cn(
        variant === 'default' && 'bg-background',
        variant === 'card' && 'bg-card',
        variant === 'muted' && 'bg-muted',
        className,
      )}
      {...props}
    />
  );
}
