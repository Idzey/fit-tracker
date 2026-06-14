import * as React from 'react'
import { View } from 'react-native'
import { cn } from '@/lib/utils'
import { Text } from './text'
import { Button } from './button'

interface ErrorStateProps {
  title?: string
  message?: string
  action?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Unable to load this screen',
  message = 'Check your connection and try again.',
  action = 'Try again',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${message}`}
      className={cn('items-center py-12 px-6 gap-3', className)}
    >
      <View className="w-12 h-12 rounded-2xl bg-destructive/10 items-center justify-center">
        <Text className="text-destructive text-2xl font-bold">!</Text>
      </View>
      <Text className="font-semibold text-center text-foreground">{title}</Text>
      <Text variant="small" muted className="text-center leading-5">
        {message}
      </Text>
      {onRetry ? (
        <Button label={action} variant="secondary" onPress={onRetry} className="mt-2 px-8" />
      ) : null}
    </View>
  )
}
