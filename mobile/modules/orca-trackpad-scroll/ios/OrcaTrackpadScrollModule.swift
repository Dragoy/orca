import ExpoModulesCore

public class OrcaTrackpadScrollModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OrcaTrackpadScroll")

    View(OrcaTrackpadScrollView.self) {
      Events("onTrackpadScroll")
    }
  }
}
