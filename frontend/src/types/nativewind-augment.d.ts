import 'react-native'

declare module 'react-native' {
  interface PressableProps {
    className?: string
  }

  interface TextInputProps {
    className?: string
  }
}

