import type { Config } from 'jest'

const config: Config = {
    verbose: true,
    coverageDirectory: './coverage/',
    collectCoverage: false,
    preset: 'ts-jest',
    globalSetup: "<rootDir>/tests/globalSetup.ts",
    globalTeardown: "<rootDir>/tests/globalTeardown.ts",
    setupFilesAfterEnv: [
        '<rootDir>/tests/testSetup.ts'
    ],
    modulePathIgnorePatterns: ["<rootDir>/dist/"],
}

export default config