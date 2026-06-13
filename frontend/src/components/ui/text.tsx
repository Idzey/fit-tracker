import * as React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { cn } from '@/lib/utils';

interface TextUIProps extends TextProps {
  variant?: 'default' | 'title' | 'subtitle' | 'small' | 'label' | 'mono';
  muted?: boolean;
}

export function Text({ className, variant = 'default', muted, ...props }: TextUIProps) {
  return (
    <RNText
      className={cn(
        'text-foreground',
        variant === 'default' && 'text-base font-medium',
        variant === 'title' && 'text-4xl font-semibold',
        variant === 'subtitle' && 'text-3xl font-semibold leading-tight',
        variant === 'small' && 'text-sm font-medium',
        variant === 'label' && 'text-xs font-semibold tracking-wide uppercase',
        variant === 'mono' && 'font-mono text-xs',
        muted && 'text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
