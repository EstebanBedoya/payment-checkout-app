import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  transform: { 
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' }, diagnostics: false }],
    '^.+\\.mjs$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', allowJs: true }, diagnostics: false }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(msw|@mswjs)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { 
    '\\.(css|less|scss)$': 'identity-obj-proxy', 
    '\\.(jpg|png|svg|webp)$': '<rootDir>/__mocks__/fileMock.ts' 
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/**/*.d.ts',
    '!src/api/**',
    '!src/mocks/**',
    '!src/**/*.mock.ts',
    '!src/utils/env.ts',
  ],
  coverageThreshold: { global: { lines: 80, branches: 80, functions: 80, statements: 80 } },
}

export default config
