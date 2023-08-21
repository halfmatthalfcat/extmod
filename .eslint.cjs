/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  root: true,
  rules: {
    'array-element-newline': ['error', { multiline: false }],
    'arrow-parens': ['error', 'as-needed'],
    'object-property-newline': 'error',
  },
};
