const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  testMatch: [
    '**/?(*.)+(spec|test).ts',
    '**/tests/**/*.(spec|test).ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    ...tsJestTransformCfg,
  },
  // Coverage settings
  collectCoverageFrom: [
    'api/**/*.ts',
    'config/**/*.ts',
    'controllers/**/*.ts',
    'helpers/**/*.ts',
    'middleware/**/*.ts',
    'models/**/*.ts',
    'routes/**/*.ts',
    // Exclude definitions, tests and migration/config util files
    '!**/*.d.ts',
    '!**/?(*.)+(spec|test).ts',
    '!tests/**',
    '!migrate-mongo-config.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageProvider: 'v8',
};
