import type { ComponentType } from 'react'
import { requireNativeViewManager } from 'expo-modules-core'
import type { TrackpadScrollCaptureProps } from './types'

export type { TrackpadScrollCaptureProps, TrackpadScrollEvent } from './types'

export const TrackpadScrollCapture: ComponentType<TrackpadScrollCaptureProps> =
  requireNativeViewManager<TrackpadScrollCaptureProps>('OrcaTrackpadScroll')
