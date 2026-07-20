export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // '.js' se omite: package.json ya declara "type": "module", así que
  // jest-config (29.7.0) infiere ESM automáticamente e invalida listarlo aquí
  extensionsToTreatAsEsm: ['.ts'],
  // .ts primero: algunos módulos en src/ tienen un .js homónimo obsoleto
  // (compilado antiguo); sin esto Node resuelve el .js stale en vez del .ts vigente
  moduleFileExtensions: ['ts', 'js', 'mjs', 'cjs', 'jsx', 'tsx', 'json', 'node'],
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
