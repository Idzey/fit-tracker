export const subscriptionKeys = {
  all: ['subscription'] as const,
  mine: () => [...subscriptionKeys.all, 'mine'] as const,
}
