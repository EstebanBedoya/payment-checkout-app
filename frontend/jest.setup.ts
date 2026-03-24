import '@testing-library/jest-dom'

// Mock import.meta.env for Jest
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3001/api/v1',
        VITE_WOMPI_PUBLIC_KEY: 'pub_test',
        VITE_WOMPI_API_URL: 'https://api-sandbox.co.uat.wompi.dev/v1'
      }
    }
  },
  writable: true
})
