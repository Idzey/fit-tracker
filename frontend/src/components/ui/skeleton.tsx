import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: ViewProps) {
  return <View className={cn('rounded-xl bg-muted', className)} {...props} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <View className={cn('p-4 gap-2', className)}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-28" />
    </View>
  );
}
