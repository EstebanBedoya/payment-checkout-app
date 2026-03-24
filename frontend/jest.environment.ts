import { TestEnvironment } from 'jest-environment-jsdom'

// MSW v2 requires fetch globals that jsdom doesn't expose.
// Node 22 has them natively — copy them into the jsdom global after setup.
export default class MSWTestEnvironment extends TestEnvironment {
  async setup() {
    await super.setup()
    if (typeof this.global.fetch === 'undefined') {
      this.global.fetch = fetch
      this.global.Request = Request as typeof this.global.Request
      this.global.Response = Response as typeof this.global.Response
      this.global.Headers = Headers as typeof this.global.Headers
    }
  }
}
