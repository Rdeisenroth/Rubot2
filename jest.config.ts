import type { Config } from 'jest'

const config: Config = {
    verbose: true,
    coverageDirectory: './coverage/',
    collectCoverage: false,
    preset: 'ts-jest',
    globalSetup: "<rootDir>/globalSetup.ts",
    globalTeardown: "<rootDir>/globalTeardown.ts",
    setupFilesAfterEnv: [
        '<rootDir>/testSetup.ts'
    ]
}

export default config