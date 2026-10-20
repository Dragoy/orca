import type { HardwareKeyboardCaptureProps } from './types'

export type {
  HardwareKeyboardCaptureProps,
  HardwareKeyboardKeyEvent,
  HardwareKeyboardModifier
} from './types'

// Only iOS needs native capture; elsewhere the field is rendered unchanged.
export function HardwareKeyboardCapture({ children }: HardwareKeyboardCaptureProps) {
  return children
}

export function useHardwareKeyboardConnected(): boolean {
  return false
}
