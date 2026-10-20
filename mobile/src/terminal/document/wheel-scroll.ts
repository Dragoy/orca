import { getCellHeight, getTotalScale } from './cell-metrics'
import { routeScrollLines, shouldRouteScrollToTerminalInput } from './mouse-input-encoding'
import { dispatcherShouldBlockSurface } from './tap-dispatch'
import {
  enqueueNormalBufferScrollDelta,
  resetSmoothScrollOffset
} from './normal-buffer-smooth-scroll'
import type { TerminalDocumentScope } from './document-scope'

export function wheelEventPixelDeltaY(scope: TerminalDocumentScope, e: WheelEvent) {
  const delta = e.deltaY
  if (typeof delta !== 'number' || !Number.isFinite(delta) || delta === 0) {
    return 0
  }
  // DOM_DELTA_LINE / DOM_DELTA_PAGE: Android WebView reports line-mode deltas
  // for external mouse wheels, iOS trackpads report pixels.
  if (e.deltaMode === 1) {
    return delta * getCellHeight(scope) * getTotalScale(scope)
  }
  if (e.deltaMode === 2) {
    return delta * scope.viewportRect().height
  }
  return delta
}

export function attachSurfaceWheelHandler(
  scope: TerminalDocumentScope,
  targetSurface: HTMLElement
) {
  targetSurface.addEventListener(
    'wheel',
    function (e) {
      if (dispatcherShouldBlockSurface(scope)) {
        return
      }
      if (!scope.term) {
        return
      }
      // Why: xterm's own wheel handler scrolls its hidden viewport or emits
      // cursor keys through onData, which the mobile query-reply gate drops.
      // Claim the event so indirect pointers share the touch scroll router.
      e.preventDefault()
      e.stopPropagation()

      // Why: a trackpad pinch arrives as ctrl+wheel. Swallow it rather than
      // firing cursor keys at the TUI; two-finger pinch still drives text size.
      if (e.ctrlKey) {
        return
      }

      if (e.isTrusted) {
        scope.domWheelSeen = true
      }
      scrollTerminalByWheel(scope, wheelEventPixelDeltaY(scope, e), e.clientX, e.clientY)
    },
    { capture: true, passive: false }
  )
}

/**
 * A trackpad scroll the host caught natively: iOS disables the WebView's scroll view, so a
 * two-finger trackpad scroll never becomes a DOM wheel event on its own.
 */
export function scrollTerminalByHostWheel(
  scope: TerminalDocumentScope,
  deltaY: number,
  clientX: number,
  clientY: number
) {
  if (scope.domWheelSeen || dispatcherShouldBlockSurface(scope) || !scope.term) {
    return
  }
  if (!Number.isFinite(deltaY) || !Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return
  }
  scrollTerminalByWheel(scope, deltaY, clientX, clientY)
}

function scrollTerminalByWheel(
  scope: TerminalDocumentScope,
  deltaY: number,
  clientX: number,
  clientY: number
) {
  if (deltaY === 0) {
    return
  }

  if (shouldRouteScrollToTerminalInput(scope)) {
    resetSmoothScrollOffset(scope)
    const effectiveCellH = getCellHeight(scope) * getTotalScale(scope)
    if (!(effectiveCellH > 0)) {
      return
    }
    scope.wheelAccumDeltaY += deltaY
    const lines = Math.trunc(scope.wheelAccumDeltaY / effectiveCellH)
    if (lines !== 0) {
      scope.wheelAccumDeltaY -= lines * effectiveCellH
      routeScrollLines(scope, lines, clientX, clientY)
    }
    return
  }
  scope.wheelAccumDeltaY = 0
  enqueueNormalBufferScrollDelta(scope, deltaY)
}
