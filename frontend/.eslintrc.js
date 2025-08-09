module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'react',
    'react-hooks'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // React specific
    'react/prop-types': 'off', // We're not using PropTypes
    'react/react-in-jsx-scope': 'off', // React 17+ doesn't need React import
    'react/jsx-uses-react': 'off',
    'react/display-name': 'warn',
    'react/jsx-key': 'error',
    'react/no-unescaped-entities': 'warn',
    
    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn', // Warn instead of error for missing deps
    
    // Console - warn in production builds
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    
    // Unused variables
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    
    // Code quality
    'no-var': 'error',
    'prefer-const': 'warn',
    'prefer-arrow-callback': 'warn',
    'arrow-spacing': 'warn',
    'no-trailing-spaces': 'warn',
    'comma-dangle': ['warn', 'never'],
    'semi': ['warn', 'always'],
    'quotes': ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'jsx-quotes': ['warn', 'prefer-double'],
    
    // Error handling
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    'no-useless-catch': 'warn',
    'no-inner-declarations': 'warn',
    
    // Async/await
    'no-async-promise-executor': 'error'
  },
  ignorePatterns: [
    'node_modules/',
    'build/',
    'dist/',
    'coverage/',
    '*.min.js',
    'public/',
    'src/serviceWorker.js',
    'src/setupTests.js',
    'scripts/',
    'craco.config.js'
  ],
  overrides: [
    {
      // Test files
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
      rules: {
        'no-unused-expressions': 'off',
        'react/display-name': 'off'
      }
    },
    {
      // Config files
      files: ['*.config.js', 'scripts/*.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};