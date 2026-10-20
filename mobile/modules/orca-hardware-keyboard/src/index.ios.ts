import { useEffect, useState, type ComponentType } from 'react'
import {
  requireNativeModule,
  requireNativeViewManager,
  type EventSubscription
} from 'expo-modules-core'
import type { HardwareKeyboardCaptureProps } from './types'

export type {
  HardwareKeyboardCaptureProps,
  HardwareKeyboardKeyEvent,
  HardwareKeyboardModifier
} from './types'

type HardwareKeyboardModule = {
  isConnected(): Promise<boolean>
  addListener(
    event: 'onConnectionChange',
    listener: (event: { connected: boolean }) => void
  ): EventSubscription
}

const nativeModule = requireNativeModule<HardwareKeyboardModule>('OrcaHardwareKeyboard')

export const HardwareKeyboardCapture: ComponentType<HardwareKeyboardCaptureProps> =
  requireNativeViewManager<HardwareKeyboardCaptureProps>('OrcaHardwareKeyboard')

export function useHardwareKeyboardConnected(): boolean {
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    let disposed = false
    const subscription = nativeModule.addListener('onConnectionChange', (event) => {
      setConnected(event.connected)
    })
    void nativeModule.isConnected().then((value) => {
      if (!disposed) {
        setConnected(value)
      }
    })
    return () => {
      disposed = true
      subscription.remove()
    }
  }, [])
  return connected
}
