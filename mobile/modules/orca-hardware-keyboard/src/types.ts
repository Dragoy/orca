import type { ReactNode } from 'react'
import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native'

export type HardwareKeyboardModifier = 'ctrl' | 'alt' | 'shift'

/** A chord the TextInput cannot report: `key` is a terminal shortcut key id or one printable char. */
export type HardwareKeyboardKeyEvent = {
  readonly key: string
  readonly modifiers: readonly HardwareKeyboardModifier[]
}

export type HardwareKeyboardCaptureProps = {
  readonly children: ReactNode
  readonly style?: StyleProp<ViewStyle>
  /** Claim hardware chords while a descendant text field is focused. */
  readonly captureEnabled: boolean
  /** Take focus back when the terminal WebView steals it from the descendant field. */
  readonly holdFocus: boolean
  readonly optionAsMeta?: boolean
  readonly onTerminalKey: (event: NativeSyntheticEvent<HardwareKeyboardKeyEvent>) => void
}
