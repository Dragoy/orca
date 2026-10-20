import { buildTerminalShortcutKey, type TerminalShortcutModifier } from './terminal-accessory-keys'
import {
  createTerminalLiveAccessoryInput,
  type TerminalLiveAccessoryInput
} from './terminal-live-accessory-input'

export type TerminalHardwareKeyEvent = {
  readonly key: string
  readonly modifiers: readonly string[]
}

const HARDWARE_KEY_MODIFIERS = new Set<string>(['ctrl', 'alt', 'shift'])

function isTerminalShortcutModifier(value: string): value is TerminalShortcutModifier {
  return HARDWARE_KEY_MODIFIERS.has(value)
}

/** Encodes a hardware chord the native capture reported, or null when it has no terminal bytes. */
export function buildTerminalHardwareKeyInput(
  event: TerminalHardwareKeyEvent
): TerminalLiveAccessoryInput | null {
  if (!event.modifiers.every(isTerminalShortcutModifier)) {
    return null
  }
  const modifiers = event.modifiers.filter(isTerminalShortcutModifier)
  const shortcut = buildTerminalShortcutKey({ key: event.key, modifiers })
  if (!shortcut) {
    return null
  }
  // Only a bare key mirrors the accessory key's local edit; a chord (Alt+⌫ deletes a word) does not.
  const id = modifiers.length === 0 ? event.key : 'chord'
  return createTerminalLiveAccessoryInput({ id, bytes: shortcut.bytes })
}
