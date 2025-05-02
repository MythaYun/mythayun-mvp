const nextJest = require('next/jest');

// Providing the path to your Next.js app
const createJestConfig = nextJest({ dir: './' });

// Custom Jest configuration
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/public/(.*)$': '<rootDir>/public/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/'
  ],
  collectCoverageFrom: [
    'app/components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{js,jsx,ts,tsx}'
  ],
  // CI-friendly coverage settings
  coverageThreshold: process.env.CI 
    ? undefined  // Disable thresholds in CI for now
    : {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50
        }
      },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest']
  },
  reporters: [
    'default',
    process.env.CI && ['jest-junit', { outputDirectory: 'reports', outputName: 'jest-junit.xml' }]
  ].filter(Boolean),
  maxWorkers: process.env.CI ? 2 : '50%'
};

module.exports = createJestConfig(customJestConfig);