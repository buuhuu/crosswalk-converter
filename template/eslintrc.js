module.exports = {
  env: {
    node: true,
    mocha: true,
  },
  ignorePatterns: [
    'dist/*',
  ],
  plugins: [
    'mocha',
  ],
  overrides: [
    {
      files: ['webpack.config.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
