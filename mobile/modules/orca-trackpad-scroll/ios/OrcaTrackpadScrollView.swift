import ExpoModulesCore
import UIKit

/// Wraps the terminal WebView. Its scroll view is disabled so touch drags reach the document's own
/// scroll router, which also shuts the path WebKit turns trackpad scrolls into DOM wheel events.
/// Pan recognizers that accept scroll events only (never touches) catch them here instead.
final class OrcaTrackpadScrollView: ExpoView, UIGestureRecognizerDelegate {
  let onTrackpadScroll = EventDispatcher()

  private var lastTranslationY: CGFloat = 0
  private var lastLocation: CGPoint = .zero
  private var momentumVelocity: CGFloat = 0
  private var momentumLink: CADisplayLink?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    addScrollRecognizer(.continuous, action: #selector(handleTrackpadPan(_:)))
    addScrollRecognizer(.discrete, action: #selector(handleWheelPan(_:)))
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      stopMomentum()
    }
  }

  private func addScrollRecognizer(_ types: UIScrollTypeMask, action: Selector) {
    let pan = UIPanGestureRecognizer(target: self, action: action)
    pan.allowedScrollTypesMask = types
    pan.allowedTouchTypes = []
    pan.cancelsTouchesInView = false
    pan.delegate = self
    addGestureRecognizer(pan)
  }

  @objc private func handleTrackpadPan(_ pan: UIPanGestureRecognizer) {
    forward(pan)
    if pan.state == .ended {
      // Lifting the fingers mid-flick keeps scrolling, as every other iPad scroll view does.
      startMomentum(velocity: -pan.velocity(in: self).y)
    }
  }

  @objc private func handleWheelPan(_ pan: UIPanGestureRecognizer) {
    forward(pan)
  }

  private func forward(_ pan: UIPanGestureRecognizer) {
    switch pan.state {
    case .began:
      stopMomentum()
      lastTranslationY = 0
    case .changed:
      let translationY = pan.translation(in: self).y
      let delta = translationY - lastTranslationY
      lastTranslationY = translationY
      lastLocation = pan.location(in: self)
      // Fingers moving down reveal earlier output, which a DOM wheel reports as negative deltaY.
      emit(-delta)
    default:
      lastTranslationY = 0
    }
  }

  private func emit(_ deltaY: CGFloat) {
    guard deltaY != 0, deltaY.isFinite else {
      return
    }
    onTrackpadScroll(["deltaY": deltaY, "x": lastLocation.x, "y": lastLocation.y])
  }

  private func startMomentum(velocity: CGFloat) {
    stopMomentum()
    guard abs(velocity) > Self.momentumStopVelocity else {
      return
    }
    momentumVelocity = velocity
    let link = CADisplayLink(target: self, selector: #selector(stepMomentum(_:)))
    link.add(to: .main, forMode: .common)
    momentumLink = link
  }

  @objc private func stepMomentum(_ link: CADisplayLink) {
    let elapsed = max(0, link.targetTimestamp - link.timestamp)
    emit(momentumVelocity * CGFloat(elapsed))
    // UIScrollView's normal deceleration rate, per millisecond.
    momentumVelocity *= CGFloat(pow(0.998, elapsed * 1000))
    if abs(momentumVelocity) < Self.momentumStopVelocity {
      stopMomentum()
    }
  }

  private func stopMomentum() {
    momentumLink?.invalidate()
    momentumLink = nil
    momentumVelocity = 0
  }

  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    true
  }

  private static let momentumStopVelocity: CGFloat = 20
}
