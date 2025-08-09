module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Allow console in backend for logging
    'no-console': 'off',

    // Warn for unused variables instead of error
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],

    // Node.js specific rules
    'handle-callback-err': 'warn',
    'no-path-concat': 'error',
    'no-sync': 'warn',

    // Code quality
    'no-var': 'error',
    'prefer-const': 'warn',
    'prefer-arrow-callback': 'warn',
    'arrow-spacing': 'warn',
    'no-trailing-spaces': 'warn',
    'comma-dangle': ['warn', 'never'],
    'semi': ['warn', 'always'],
    'quotes': ['warn', 'single'],

    // Error handling
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',

    // Async/await
    'no-async-promise-executor': 'error',
    'require-await': 'warn'
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'tests/legacy/',
    '*.min.js',
    'dist/',
    'build/'
  ],
  overrides: [
    {
      // Test files
      files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
      rules: {
        'no-unused-expressions': 'off'
      }
    },
    {
      // Utility scripts
      files: ['utils/*.js', 'scripts/*.js'],
      rules: {
        'no-console': 'off',
        'no-sync': 'off'
      }
    }
  ]
};