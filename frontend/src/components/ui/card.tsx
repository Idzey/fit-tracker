import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: ViewProps) {
  return (
    <View className={cn('bg-card rounded-2xl p-4', className)} {...props} />
  );
}

export function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn('gap-1 mb-2', className)} {...props} />;
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn('gap-2', className)} {...props} />;
}
