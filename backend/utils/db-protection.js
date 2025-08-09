/**
 * Database Protection Utility
 * Prevents accidental database initialization in production
 */

const PROTECTED_URLS = [
  'mongodb+srv://likorea',
  'mongodb://likorea-prod',
  'atlas.mongodb.net',
  'production-cluster'
];

const PROTECTED_DBS = [
  'likorea-production',
  'likorea-prod',
  'production'
];

/**
 * Check if the current environment is production
 * @returns {boolean}
 */
function isProductionEnvironment() {
  return process.env.NODE_ENV === 'production' ||
         process.env.ENVIRONMENT === 'production';
}

/**
 * Check if a MongoDB URI is protected
 * @param {string} uri - MongoDB connection URI
 * @returns {boolean}
 */
function isProtectedURI(uri) {
  if (!uri) return false;

  // Check against protected URL patterns
  for (const pattern of PROTECTED_URLS) {
    if (uri.includes(pattern)) {
      return true;
    }
  }

  // Check against protected database names
  for (const dbName of PROTECTED_DBS) {
    if (uri.includes(`/${dbName}`) || uri.includes(`/${dbName}?`)) {
      return true;
    }
  }

  return false;
}

/**
 * Verify if database operations are safe
 * @param {string} operation - The operation being performed
 * @returns {object} - { safe: boolean, reason: string }
 */
function verifyDatabaseSafety(operation = 'unknown') {
  const mongoUri = process.env.MONGO_URI;
  const isProduction = isProductionEnvironment();
  const isProtected = isProtectedURI(mongoUri);

  // Log current environment for debugging
  console.log(`[DB Protection] Environment: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`[DB Protection] Operation: ${operation}`);
  console.log(`[DB Protection] URI Protected: ${isProtected}`);

  // Dangerous operations that should be blocked in production
  const dangerousOperations = [
    'dropDatabase',
    'dropCollection',
    'deleteMany',
    'initDB',
    'resetDB',
    'seedDB'
  ];

  const isDangerous = dangerousOperations.includes(operation);

  // Block dangerous operations in production
  if (isProduction && isDangerous) {
    return {
      safe: false,
      reason: `Operation '${operation}' is not allowed in production environment`
    };
  }

  // Block operations on protected URIs
  if (isProtected && isDangerous) {
    return {
      safe: false,
      reason: `Operation '${operation}' is not allowed on protected database`
    };
  }

  // Additional safety check - require explicit confirmation for dangerous operations
  if (isDangerous && !process.env.FORCE_DB_OPERATION) {
    return {
      safe: false,
      reason: `Dangerous operation '${operation}' requires FORCE_DB_OPERATION=true environment variable`
    };
  }

  return {
    safe: true,
    reason: 'Operation allowed'
  };
}

/**
 * Safe database operation wrapper
 * @param {string} operation - Operation name
 * @param {Function} callback - Function to execute if safe
 * @returns {Promise<any>}
 */
async function safeDbOperation(operation, callback) {
  const safety = verifyDatabaseSafety(operation);

  if (!safety.safe) {
    console.error(`[DB Protection] ❌ BLOCKED: ${safety.reason}`);
    throw new Error(`Database operation blocked: ${safety.reason}`);
  }

  console.log(`[DB Protection] ✅ ALLOWED: ${operation}`);
  return await callback();
}

/**
 * Get safe connection options for MongoDB
 * @returns {object} - MongoDB connection options
 */
function getSafeConnectionOptions() {
  const baseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  };

  // In production, add extra safety measures
  if (isProductionEnvironment()) {
    return {
      ...baseOptions,
      retryWrites: true,
      w: 'majority', // Ensure writes are acknowledged by majority
      readPreference: 'primaryPreferred', // Prefer primary for consistency
      maxPoolSize: 10, // Limit connection pool
      minPoolSize: 2
    };
  }

  return baseOptions;
}

module.exports = {
  isProductionEnvironment,
  isProtectedURI,
  verifyDatabaseSafety,
  safeDbOperation,
  getSafeConnectionOptions
};