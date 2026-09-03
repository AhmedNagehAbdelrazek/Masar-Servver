import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/tests/unit/**/*.test.{js,ts}',
    '**/tests/integration/**/*.test.js',
    '**/tests/contract/**/*.test.js',
  ],
  setupFiles: ['<rootDir>/tests/setup/env.ts'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json', diagnostics: false, isolatedModules: true }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 30000,
};

export default config;
module.exports = config;
