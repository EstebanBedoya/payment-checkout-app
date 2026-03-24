// Centralises env var access so tests can override via jest.mock or globalThis.
// In Vite production builds, VITE_API_URL is injected at build time via define.
// In Jest (Node.js), process.env.VITE_API_URL is used, defaulting to localhost.
export const API_BASE_URL: string =
  typeof process !== 'undefined' && process.env.VITE_API_URL
    ? process.env.VITE_API_URL
    : (globalThis as unknown as { __VITE_API_URL__?: string }).__VITE_API_URL__ ?? 'http://localhost:3001'

