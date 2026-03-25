// Centralises env var access so tests can override via jest.mock or globalThis.
// In Vite production builds, VITE_* vars are injected at build time.
// In Jest (Node.js), process.env.VITE_* is used, defaulting to localhost/sandbox values.
export const API_BASE_URL: string =
  typeof process !== 'undefined' && process.env.VITE_API_URL
    ? process.env.VITE_API_URL
    : (globalThis as unknown as { __VITE_API_URL__?: string }).__VITE_API_URL__ ?? 'http://localhost:3001'

export const WOMPI_PUBLIC_KEY: string =
  typeof process !== 'undefined' && process.env.VITE_WOMPI_PUBLIC_KEY
    ? process.env.VITE_WOMPI_PUBLIC_KEY
    : 'pub_test'

export const WOMPI_API_URL: string =
  typeof process !== 'undefined' && process.env.VITE_WOMPI_API_URL
    ? process.env.VITE_WOMPI_API_URL
    : 'https://api-sandbox.co.uat.wompi.dev/v1'

