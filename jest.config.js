export default {
  transform: {},
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/tests/**'],
  transformIgnorePatterns: [],
}; 