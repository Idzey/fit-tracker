import * as React from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { triggerImpact } from '@/shared/lib/haptics';
import { Text } from './text';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-2xl active:opacity-75 disabled:opacity-40',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-card border border-border',
        destructive: 'bg-destructive',
        ghost: 'bg-transparent',
        outline: 'bg-transparent border border-primary',
      },
      size: {
        default: 'h-[52px] px-6',
        sm: 'h-10 px-4 rounded-xl',
        lg: 'h-16 px-8',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const labelVariants = cva('text-base font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-foreground',
      destructive: 'text-destructive-foreground',
      ghost: 'text-foreground',
      outline: 'text-primary',
    },
  },
  defaultVariants: { variant: 'default' },
});

interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  label?: string;
  loading?: boolean;
  children?: React.ReactNode;
  haptic?: false | 'light' | 'medium' | 'heavy';
}

export function Button({
  label,
  loading,
  variant,
  size,
  disabled,
  className,
  children,
  haptic = 'light',
  onPress,
  accessibilityLabel,
  accessibilityState,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress: PressableProps['onPress'] = (event) => {
    if (!isDisabled && haptic) triggerImpact(haptic);
    onPress?.(event);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading, ...accessibilityState }}
      disabled={isDisabled}
      onPress={handlePress}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' || variant === 'outline' ? '#3c87f7' : '#fff'} size="small" />
      ) : children ?? (
        <Text className={cn(labelVariants({ variant }))}>{label}</Text>
      )}
    </Pressable>
  );
}
