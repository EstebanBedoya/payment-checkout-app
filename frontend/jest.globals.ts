// Polyfill Node.js web globals for jsdom + MSW v2 compatibility
import { TextDecoder, TextEncoder } from 'util'
import { ReadableStream, TransformStream, WritableStream } from 'stream/web'

Object.assign(global, {
  TextDecoder,
  TextEncoder,
  ReadableStream,
  TransformStream,
  WritableStream,
  MessagePort: (global as unknown as Record<string, unknown>).MessagePort ?? class MessagePort {},
})
