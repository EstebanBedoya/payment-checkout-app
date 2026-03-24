// Custom Jest environment: extends jsdom and restores Node 22 web globals
// that jsdom may not expose in its sandbox, required for MSW v2.
const { TestEnvironment } = require('jest-environment-jsdom')

class MSWTestEnvironment extends TestEnvironment {
  async setup() {
    await super.setup()
    const g = this.global

    // TextEncoder / TextDecoder
    if (typeof g.TextEncoder === 'undefined') {
      const { TextEncoder, TextDecoder } = require('util')
      Object.assign(g, { TextEncoder, TextDecoder })
    }

    // Web Streams API (Node 18+ globals; jsdom may not expose them)
    if (typeof g.TransformStream === 'undefined') {
      const streams = require('stream/web')
      Object.assign(g, {
        ReadableStream: streams.ReadableStream,
        WritableStream: streams.WritableStream,
        TransformStream: streams.TransformStream,
      })
    }

    // BroadcastChannel (Node 15+; used by MSW for WebSocket support)
    if (typeof g.BroadcastChannel === 'undefined') {
      g.BroadcastChannel = global.BroadcastChannel
    }

    // Fetch API globals
    if (typeof g.Response === 'undefined') {
      Object.assign(g, {
        fetch: global.fetch,
        Request: global.Request,
        Response: global.Response,
        Headers: global.Headers,
      })
    }
  }
}

module.exports = MSWTestEnvironment
