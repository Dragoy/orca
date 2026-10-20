import type { TrackpadScrollCaptureProps } from './types'

export type { TrackpadScrollCaptureProps, TrackpadScrollEvent } from './types'

// Only iOS loses trackpad scrolls to the disabled WebView scroll view; elsewhere render unchanged.
export function TrackpadScrollCapture({ children }: TrackpadScrollCaptureProps) {
  return children
}
