import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

type ImpactStyle = 'light' | 'medium' | 'heavy'

const impactStyleMap: Record<ImpactStyle, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
}

function canUseHaptics() {
  return Platform.OS !== 'web'
}

export function triggerImpact(style: ImpactStyle = 'light') {
  if (!canUseHaptics()) return
  void Haptics.impactAsync(impactStyleMap[style]).catch(() => undefined)
}

export function triggerSelection() {
  if (!canUseHaptics()) return
  void Haptics.selectionAsync().catch(() => undefined)
}

export function triggerNotification(type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) {
  if (!canUseHaptics()) return
  void Haptics.notificationAsync(type).catch(() => undefined)
}
