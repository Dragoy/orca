import { platform, release } from 'node:os'
import { macOSMajorFromDarwinRelease } from '../macos-version'

// Why: the bundled serve-sim-bin helper is built with a macOS 14.0 deployment target,
// while Orca itself still launches on macOS 12. Raising the Mach-O field would not
// supply the missing Foundation symbols, so surface an actionable requirement instead
// of a raw dyld failure.
export const SERVE_SIM_MIN_MACOS_MAJOR = 14

export function getServeSimHostUnsupportedMessage(
  host: { platform: NodeJS.Platform; release: string } = {
    platform: platform(),
    release: release()
  }
): string | null {
  if (host.platform !== 'darwin') {
    return null
  }
  const macOSMajor = macOSMajorFromDarwinRelease(host.release)
  if (macOSMajor === null || macOSMajor >= SERVE_SIM_MIN_MACOS_MAJOR) {
    return null
  }
  return `The iOS Simulator integration requires macOS ${SERVE_SIM_MIN_MACOS_MAJOR} or later (this Mac is running macOS ${macOSMajor}). Update macOS to use it; Android emulators are unaffected.`
}

const DYLD_LOAD_FAILURE = /dyld|Symbol not found|Library not loaded/i

// Why: if the OS check could not run (unknown release) or a dependency is otherwise
// missing, still replace the raw dyld dump with a readable explanation.
export function describeServeSimHelperFailure(message: string): string | null {
  if (!DYLD_LOAD_FAILURE.test(message)) {
    return null
  }
  return `The iOS Simulator helper could not start because it links against system libraries this macOS does not provide (it requires macOS ${SERVE_SIM_MIN_MACOS_MAJOR} or later).\n\n${message}`
}
