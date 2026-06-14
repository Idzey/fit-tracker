import * as React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';
import { Button } from './button';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  icon?: string;
  className?: string;
  accessibilityLabel?: string;
}

export function EmptyState({ title, subtitle, action, onAction, icon, className, accessibilityLabel }: EmptyStateProps) {
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join('. ')}
      className={cn('items-center py-12 px-6 gap-3', className)}
    >
      {icon ? <Text className="text-5xl" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{icon}</Text> : null}
      <Text className="font-semibold text-center text-foreground">{title}</Text>
      {subtitle ? <Text variant="small" muted className="text-center leading-5">{subtitle}</Text> : null}
      {action && onAction ? (
        <Button label={action} onPress={onAction} className="mt-2 px-8" />
      ) : null}
    </View>
  );
}
