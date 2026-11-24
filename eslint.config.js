import parser from '@babel/eslint-parser';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'portfolio-server.mjs', 'coverage/**', 'public/**'] },
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    rules: {
      'no-dupe-else-if': 'error',
      'no-duplicate-case': 'error',
      'no-fallthrough': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'valid-typeof': 'error',
    },
  },
  ...['ts', 'tsx'].map(extension => ({
    files: [`**/*.${extension}`],
    languageOptions: {
      parser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false, configFile: false,
          parserOpts: { plugins: extension === 'tsx' ? ['typescript', 'jsx'] : ['typescript'] },
        },
      },
    },
  })),
];
