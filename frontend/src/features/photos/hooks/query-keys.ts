export const photoKeys = {
  all: ['photos'] as const,
  mine: () => [...photoKeys.all, 'mine'] as const,
  client: (clientId: string) => [...photoKeys.all, 'client', clientId] as const,
}
