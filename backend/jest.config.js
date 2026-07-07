export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  // .ts antes que .js: algunos módulos en src/ tienen un .js compilado obsoleto
  // junto al .ts fuente (artefacto de build); sin esta prioridad, Jest resuelve
  // el .js obsoleto en vez del .ts vigente al mapear imports "./Foo.js" -> "./Foo".
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '@/(.*)': '<rootDir>/src/$1',
    '@modules/(.*)': '<rootDir>/src/modules/$1',
    '@routes/(.*)': '<rootDir>/src/routes/$1',
    '@middleware/(.*)': '<rootDir>/src/middleware/$1',
    '@utils/(.*)': '<rootDir>/src/utils/$1',
    '@types/(.*)': '<rootDir>/src/types/$1',
    '@config/(.*)': '<rootDir>/src/config/$1',
  },
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          target: 'ES2020',
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'load-testing.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
};
