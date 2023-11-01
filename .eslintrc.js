module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
    mocha: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    // allow reassigning param
    'no-param-reassign': [2, { props: false }],
    'linebreak-style': ['error', 'unix'],
    'import/extensions': ['error', {
      js: 'always',
    }],
    // mocha specific rules
    'mocha/no-skipped-tests': 'error',
    'mocha/no-exclusive-tests': 'error',
  },
  overrides: [
    {
      files: ['template/**.*'],
      rules: {
        'import/no-unresolved': 'off',
        'import/extensions': 'off',
      },
    },
  ],
  plugins: [
    'mocha',
  ],
};
