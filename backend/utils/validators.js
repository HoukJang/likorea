/**
 * Validation utility functions
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} Whether password is valid
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8;
};

/**
 * Validate user ID
 * @param {string} id - User ID to validate
 * @returns {boolean} Whether ID is valid
 */
const validateId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return id.length >= 3 && id.length <= 50 && /^[a-zA-Z0-9_]+$/.test(id);
};

/**
 * Validate title
 * @param {string} title - Title to validate
 * @returns {boolean} Whether title is valid
 */
const validateTitle = (title) => {
  if (!title || typeof title !== 'string') return false;
  return title.trim().length > 0 && title.length <= 100;
};

/**
 * Validate content
 * @param {string} content - Content to validate
 * @returns {boolean} Whether content is valid
 */
const validateContent = (content) => {
  if (!content || typeof content !== 'string') return false;
  return content.trim().length > 0;
};

/**
 * Validate authority level
 * @param {number} authority - Authority level to validate
 * @returns {boolean} Whether authority is valid
 */
const validateAuthority = (authority) => {
  if (typeof authority !== 'number') return false;
  return authority >= 1 && authority <= 5 && Number.isInteger(authority);
};

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (!input) return '';
  if (typeof input !== 'string') return '';

  // Basic HTML sanitization - in production, use a library like DOMPurify
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

module.exports = {
  validateEmail,
  validatePassword,
  validateId,
  validateTitle,
  validateContent,
  validateAuthority,
  sanitizeInput
};