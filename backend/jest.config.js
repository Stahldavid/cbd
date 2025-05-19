// backend/jest.config.js
export default {
  testEnvironment: 'node',
  clearMocks: true, // Automatically clear mock calls and instances between every test
  coverageProvider: 'v8', // or 'babel'
  // You might want to add coverage reporting later:
  // collectCoverage: true,
  // coverageDirectory: "coverage",
  // coverageReporters: ["json", "lcov", "text", "clover"],
  // Module file extensions for importing
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'json', 'node'],
  // Verbose output
  verbose: true,
  // Automatically reset mock state between every test
  resetMocks: true,
};
