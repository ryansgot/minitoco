/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [ "**/__tests__/**/*\\.+(js|ts|tsx)" ],
  testPathIgnorePatterns: [ "<rootDir>/__tests__/utils" ],
  coveragePathIgnorePatterns: [
    "<rootDir>/__tests__/utils"
  ],
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/babel-jest',
  },
};