module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'off', // Allow console.log etc.
  },
  overrides: [
    {
      files: ['cli/**/*.js'],
      rules: {
        'no-console': 'off', // Allow console.log in CLI
        'no-await-in-loop': 'off', // Allow await in loops for CLI
        'no-plusplus': 'off', // Allow ++ operator in CLI
        'no-param-reassign': 'off', // Allow parameter reassignment in CLI
      },
    },
  ],
};
