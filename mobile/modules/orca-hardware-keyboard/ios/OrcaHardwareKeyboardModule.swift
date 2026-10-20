import ExpoModulesCore
import GameController

public class OrcaHardwareKeyboardModule: Module {
  private var observers: [NSObjectProtocol] = []

  public func definition() -> ModuleDefinition {
    Name("OrcaHardwareKeyboard")

    Events("onConnectionChange")

    AsyncFunction("isConnected") { () -> Bool in
      GCKeyboard.coalesced != nil
    }.runOnQueue(.main)

    OnStartObserving {
      let center = NotificationCenter.default
      for name in [Notification.Name.GCKeyboardDidConnect, .GCKeyboardDidDisconnect] {
        self.observers.append(
          center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
            self?.sendEvent("onConnectionChange", ["connected": GCKeyboard.coalesced != nil])
          })
      }
    }

    OnStopObserving {
      self.observers.forEach { NotificationCenter.default.removeObserver($0) }
      self.observers.removeAll()
    }

    View(OrcaHardwareKeyboardView.self) {
      Events("onTerminalKey")

      Prop("captureEnabled") { (view: OrcaHardwareKeyboardView, value: Bool) in
        view.captureEnabled = value
      }

      Prop("optionAsMeta") { (view: OrcaHardwareKeyboardView, value: Bool) in
        view.optionAsMeta = value
      }

      Prop("holdFocus") { (view: OrcaHardwareKeyboardView, value: Bool) in
        view.holdFocus = value
      }
    }
  }
}
