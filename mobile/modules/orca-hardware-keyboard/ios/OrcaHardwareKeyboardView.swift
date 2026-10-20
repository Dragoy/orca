import ExpoModulesCore
import UIKit

/// Wraps the live terminal TextInput. React Native's TextInput reports only printable keys,
/// Backspace and Enter from a hardware keyboard, so arrows, Esc, Tab and Ctrl/Option chords never
/// reached the terminal. Key commands on an ancestor of the focused field are asked for before the
/// text system handles the press, so this view claims those chords and leaves text to the field.
final class OrcaHardwareKeyboardView: ExpoView {
  let onTerminalKey = EventDispatcher()

  var captureEnabled = false
  var optionAsMeta = true {
    didSet {
      if oldValue != optionAsMeta {
        cachedCommands = nil
      }
    }
  }
  /// Set while a hardware keyboard is attached and the live terminal owns typing.
  var holdFocus = false

  private var cachedCommands: [UIKeyCommand]?
  private weak var focusedField: UIView?
  private var observers: [NSObjectProtocol] = []

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    let center = NotificationCenter.default
    for name in [UITextField.textDidBeginEditingNotification, UITextView.textDidBeginEditingNotification] {
      observers.append(
        center.addObserver(forName: name, object: nil, queue: .main) { [weak self] note in
          self?.fieldDidBeginEditing(note.object as? UIView)
        })
    }
    for name in [UITextField.textDidEndEditingNotification, UITextView.textDidEndEditingNotification] {
      observers.append(
        center.addObserver(forName: name, object: nil, queue: .main) { [weak self] note in
          self?.fieldDidEndEditing(note.object as? UIView)
        })
    }
  }

  deinit {
    observers.forEach { NotificationCenter.default.removeObserver($0) }
  }

  override var keyCommands: [UIKeyCommand]? {
    guard captureEnabled, focusedField != nil else {
      return nil
    }
    // Why: while an IME is composing, arrows/Esc/Tab pick candidates and must stay with it.
    if let input = focusedField as? UITextInput, input.markedTextRange != nil {
      return nil
    }
    if let cachedCommands {
      return cachedCommands
    }
    let commands = Self.buildCommands(optionAsMeta: optionAsMeta, action: #selector(orcaTerminalKeyCommand(_:)))
    cachedCommands = commands
    return commands
  }

  @objc private func orcaTerminalKeyCommand(_ command: UIKeyCommand) {
    guard captureEnabled, let input = command.input, let key = Self.keyName(for: input) else {
      return
    }
    var modifiers: [String] = []
    if command.modifierFlags.contains(.control) {
      modifiers.append("ctrl")
    }
    if command.modifierFlags.contains(.alternate) {
      modifiers.append("alt")
    }
    if command.modifierFlags.contains(.shift) {
      modifiers.append("shift")
    }
    onTerminalKey(["key": key, "modifiers": modifiers])
  }

  private func fieldDidBeginEditing(_ field: UIView?) {
    guard let field, field.isDescendant(of: self) else {
      return
    }
    focusedField = field
  }

  private func fieldDidEndEditing(_ field: UIView?) {
    guard let field, field === focusedField else {
      return
    }
    focusedField = nil
    guard holdFocus else {
      return
    }
    // Why: with a hardware keyboard attached, a tap on the terminal makes WebKit's content view
    // first responder after the field focused, so every key went to the inert xterm textarea.
    DispatchQueue.main.async { [weak self, weak field] in
      guard let self, let field, self.holdFocus, self.window != nil, field.window != nil else {
        return
      }
      guard let thief = FirstResponderProbe.current() as? UIView, self.isTerminalWebContent(thief) else {
        return
      }
      field.becomeFirstResponder()
    }
  }

  /// Only a WebKit view on this same screen counts; another screen's web page keeps its focus.
  private func isTerminalWebContent(_ view: UIView) -> Bool {
    guard String(describing: type(of: view)).hasPrefix("WK"), view.window === window else {
      return false
    }
    guard let screen = enclosingScreen(of: self) else {
      return true
    }
    return view.isDescendant(of: screen)
  }

  private func enclosingScreen(of view: UIView) -> UIView? {
    var current = view.superview
    while let candidate = current {
      if String(describing: type(of: candidate)).hasPrefix("RNSScreen") {
        return candidate
      }
      current = candidate.superview
    }
    return nil
  }

  private static let specialInputs: [(input: String, key: String)] = [
    (UIKeyCommand.inputUpArrow, "arrowUp"),
    (UIKeyCommand.inputDownArrow, "arrowDown"),
    (UIKeyCommand.inputLeftArrow, "arrowLeft"),
    (UIKeyCommand.inputRightArrow, "arrowRight"),
    (UIKeyCommand.inputEscape, "escape"),
    ("\t", "tab"),
    (UIKeyCommand.inputHome, "home"),
    (UIKeyCommand.inputEnd, "end"),
    (UIKeyCommand.inputPageUp, "pageUp"),
    (UIKeyCommand.inputPageDown, "pageDown"),
    (UIKeyCommand.inputDelete, "delete"),
    (UIKeyCommand.inputF1, "f1"),
    (UIKeyCommand.inputF2, "f2"),
    (UIKeyCommand.inputF3, "f3"),
    (UIKeyCommand.inputF4, "f4"),
    (UIKeyCommand.inputF5, "f5"),
    (UIKeyCommand.inputF6, "f6"),
    (UIKeyCommand.inputF7, "f7"),
    (UIKeyCommand.inputF8, "f8"),
    (UIKeyCommand.inputF9, "f9"),
    (UIKeyCommand.inputF10, "f10"),
    (UIKeyCommand.inputF11, "f11"),
    (UIKeyCommand.inputF12, "f12"),
  ]

  private static let chordPrintables: [String] =
    "abcdefghijklmnopqrstuvwxyz0123456789`-=[]\\;',./ ".map { String($0) }

  private static func keyName(for input: String) -> String? {
    if let special = specialInputs.first(where: { $0.input == input }) {
      return special.key
    }
    switch input {
    case "\u{8}": return "backspace"
    case "\r": return "enter"
    case " ": return "space"
    default: return input.count == 1 ? input.lowercased() : nil
    }
  }

  private static func buildCommands(optionAsMeta: Bool, action: Selector) -> [UIKeyCommand] {
    // Cmd chords are left out so paste, app switching and system shortcuts keep working.
    let specialModifiers: [UIKeyModifierFlags] = [
      [], [.shift], [.control], [.alternate],
      [.control, .shift], [.alternate, .shift], [.control, .alternate], [.control, .alternate, .shift],
    ]
    var printableModifiers: [UIKeyModifierFlags] = [[.control], [.control, .alternate]]
    if optionAsMeta {
      printableModifiers.append([.alternate])
    }

    var commands: [UIKeyCommand] = []
    for special in specialInputs {
      for flags in specialModifiers {
        commands.append(makeCommand(special.input, flags, action))
      }
    }
    // Plain Backspace and Enter stay with the TextInput, which already sends them.
    for flags: UIKeyModifierFlags in [[.control], [.alternate]] {
      commands.append(makeCommand("\u{8}", flags, action))
    }
    commands.append(makeCommand("\r", [.alternate], action))
    for printable in chordPrintables {
      for flags in printableModifiers {
        commands.append(makeCommand(printable, flags, action))
      }
    }
    return commands
  }

  private static func makeCommand(_ input: String, _ flags: UIKeyModifierFlags, _ action: Selector) -> UIKeyCommand {
    let command = UIKeyCommand(input: input, modifierFlags: flags, action: action)
    command.wantsPriorityOverSystemBehavior = true
    return command
  }
}

/// UIKit has no getter for the first responder; a nil-targeted action reaches it.
private final class FirstResponderProbe: NSObject {
  static weak var found: UIResponder?

  static func current() -> UIResponder? {
    found = nil
    UIApplication.shared.sendAction(#selector(UIResponder.orcaRecordFirstResponder), to: nil, from: nil, for: nil)
    return found
  }
}

extension UIResponder {
  @objc fileprivate func orcaRecordFirstResponder() {
    FirstResponderProbe.found = self
  }
}
