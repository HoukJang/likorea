/**
 * Environment Configuration Validator
 * Ensures all required environment variables are set
 */

const requiredEnvVars = {
  common: [
    'NODE_ENV',
    'PORT',
    'MONGO_URI',
    'JWT_SECRET'
  ],
  production: [
    'ALLOWED_ORIGINS',
    'SESSION_EXPIRY',
    'REFRESH_TOKEN_EXPIRY'
  ],
  development: [
    // Development specific requirements (optional)
  ]
};

/**
 * Validate environment variables
 * @param {string} environment - Current environment (production/development)
 * @returns {object} - { valid: boolean, missing: string[] }
 */
function validateEnvironment(environment = process.env.NODE_ENV) {
  const missing = [];

  // Check common required variables
  for (const varName of requiredEnvVars.common) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check environment-specific variables
  if (environment === 'production' && requiredEnvVars.production) {
    for (const varName of requiredEnvVars.production) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Get environment configuration with defaults
 * @returns {object} - Environment configuration
 */
function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';

  return {
    env,
    isProduction: env === 'production',
    isDevelopment: env === 'development',
    isTest: env === 'test',

    // Server configuration
    port: process.env.PORT || 5001,

    // Database configuration
    mongoUri: process.env.MONGO_URI,
    dbPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
    dbTimeout: parseInt(process.env.DB_TIMEOUT) || 30000,

    // Security configuration
    jwtSecret: process.env.JWT_SECRET,
    sessionExpiry: process.env.SESSION_EXPIRY || '24h',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',

    // CORS configuration
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000'],

    // Rate limiting
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,

    // File upload limits
    maxUploadSize: process.env.MAX_UPLOAD_SIZE || '10mb',

    // Logging
    logLevel: process.env.LOG_LEVEL || (env === 'production' ? 'error' : 'debug')
  };
}

/**
 * Load environment-specific .env file
 * @param {string} environment - Target environment
 */
function loadEnvironmentFile(environment) {
  const dotenv = require('dotenv');
  const path = require('path');

  // Try to load environment-specific file first
  const envFile = `.env.${environment}`;
  const envPath = path.resolve(process.cwd(), envFile);

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    // Fallback to default .env file
    dotenv.config();
  } else {
    console.log(`Loaded environment from ${envFile}`);
  }
}

module.exports = {
  validateEnvironment,
  getEnvironmentConfig,
  loadEnvironmentFile
};