import * as React from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({ label, error, containerClassName, className, accessibilityLabel, accessibilityHint, ...props }: InputProps) {
  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? <Text variant="small" className="font-semibold text-foreground">{label}</Text> : null}
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={error ?? accessibilityHint}
        className={cn(
          'h-[52px] px-4 rounded-2xl bg-card text-foreground text-base',
          'border border-transparent',
          error && 'border-destructive',
          className,
        )}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error ? <Text variant="small" className="text-destructive">{error}</Text> : null}
    </View>
  );
}
