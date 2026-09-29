import { describe, expect, it } from 'vitest'
import {
  describeServeSimHelperFailure,
  getServeSimHostUnsupportedMessage
} from './serve-sim-host-support'

describe('getServeSimHostUnsupportedMessage', () => {
  it('flags macOS 12 with an actionable message', () => {
    const message = getServeSimHostUnsupportedMessage({ platform: 'darwin', release: '21.6.0' })
    expect(message).toContain('macOS 14 or later')
    expect(message).toContain('macOS 12')
  })

  it('allows macOS 14+', () => {
    expect(getServeSimHostUnsupportedMessage({ platform: 'darwin', release: '23.0.0' })).toBeNull()
  })

  it('ignores non-macOS hosts', () => {
    expect(getServeSimHostUnsupportedMessage({ platform: 'linux', release: '21.0.0' })).toBeNull()
  })
})

describe('describeServeSimHelperFailure', () => {
  it('rewrites dyld symbol failures', () => {
    const raw = 'Helper failed: dyld[1]: Symbol not found: (_$s10Foundation11JSONDecoderC6decode)'
    const described = describeServeSimHelperFailure(raw)
    expect(described).toContain('macOS 14 or later')
    expect(described).toContain(raw)
  })

  it('leaves unrelated failures alone', () => {
    expect(describeServeSimHelperFailure('Port 3100 already in use')).toBeNull()
  })
})
