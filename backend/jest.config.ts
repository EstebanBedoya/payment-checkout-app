import type { Config } from 'jest'
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/node_modules/**',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/prisma.service.ts',
    '!**/prisma-*.repository.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: { global: { lines: 80, branches: 80, functions: 80, statements: 80 } },
}
export default config
