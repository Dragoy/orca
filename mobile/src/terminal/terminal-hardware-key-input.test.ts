import { describe, expect, it } from 'vitest'
import { buildTerminalHardwareKeyInput } from './terminal-hardware-key-input'

describe('buildTerminalHardwareKeyInput', () => {
  it('encodes arrows, Escape and Shift+Tab', () => {
    expect(buildTerminalHardwareKeyInput({ key: 'arrowUp', modifiers: [] })).toEqual({
      bytes: '\x1b[A'
    })
    expect(buildTerminalHardwareKeyInput({ key: 'arrowLeft', modifiers: ['ctrl'] })).toEqual({
      bytes: '\x1b[1;5D'
    })
    expect(buildTerminalHardwareKeyInput({ key: 'escape', modifiers: [] })).toEqual({
      bytes: '\x1b'
    })
    expect(buildTerminalHardwareKeyInput({ key: 'tab', modifiers: ['shift'] })).toEqual({
      bytes: '\x1b[Z'
    })
  })

  it('encodes Ctrl and Option-as-Meta chords', () => {
    expect(buildTerminalHardwareKeyInput({ key: 'c', modifiers: ['ctrl'] })).toEqual({
      bytes: '\x03'
    })
    expect(buildTerminalHardwareKeyInput({ key: 'space', modifiers: ['ctrl'] })).toEqual({
      bytes: '\x00'
    })
    expect(buildTerminalHardwareKeyInput({ key: 'b', modifiers: ['alt'] })).toEqual({
      bytes: '\x1bb'
    })
    expect(buildTerminalHardwareKeyInput({ key: 'backspace', modifiers: ['alt'] })).toEqual({
      bytes: '\x1b\x7f'
    })
  })

  it('keeps the local edit only for a bare forward delete', () => {
    expect(buildTerminalHardwareKeyInput({ key: 'delete', modifiers: [] })).toEqual({
      bytes: '\x1b[3~',
      localEdit: 'delete'
    })
    expect(buildTerminalHardwareKeyInput({ key: 'delete', modifiers: ['ctrl'] })).toEqual({
      bytes: '\x1b[3;5~'
    })
  })

  it('drops chords with no terminal encoding or unknown modifiers', () => {
    expect(buildTerminalHardwareKeyInput({ key: '1', modifiers: ['ctrl'] })).toBeNull()
    expect(buildTerminalHardwareKeyInput({ key: 'c', modifiers: ['meta'] })).toBeNull()
  })
})
