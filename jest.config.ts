import type { Config } from 'jest'
import { pathsToModuleNameMapper } from 'ts-jest/'
import { compilerOptions } from './tsconfig.json'

const config: Config = {
    verbose: true,
    coverageDirectory: './coverage/',
    collectCoverage: false,
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper:  pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/src/' })
}

export default config