import type { ReactNode } from 'react'
import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native'

/** One step of an indirect scroll, in the view's points; `deltaY` follows DOM wheel sign. */
export type TrackpadScrollEvent = {
  readonly deltaY: number
  readonly x: number
  readonly y: number
}

export type TrackpadScrollCaptureProps = {
  readonly children: ReactNode
  readonly style?: StyleProp<ViewStyle>
  readonly onTrackpadScroll: (event: NativeSyntheticEvent<TrackpadScrollEvent>) => void
}
