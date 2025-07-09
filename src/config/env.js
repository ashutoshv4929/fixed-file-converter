/**
 * Environment configuration
 * This file provides type-safe access to environment variables
 */

// Client-side environment variables (exposed to the browser)
const clientEnv = {
  // Base URL for API requests
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  
  // Application name
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'File Converter',
  
  // Environment (development, production, test)
  NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || 'development',
  
  // Whether the app is running in production
  NEXT_PUBLIC_IS_PRODUCTION: process.env.NEXT_PUBLIC_ENV === 'production',
  
  // Google Analytics ID (if used)
  NEXT_PUBLIC_GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID || '',
  
  // Sentry DSN (if used)
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  
  // Feature flags
  NEXT_PUBLIC_FEATURE_UPLOAD: process.env.NEXT_PUBLIC_FEATURE_UPLOAD !== 'false',
  NEXT_PUBLIC_FEATURE_CONVERSION: process.env.NEXT_PUBLIC_FEATURE_CONVERSION !== 'false',
  
  // Maximum file size in bytes (default: 10MB)
  NEXT_PUBLIC_MAX_FILE_SIZE: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760', 10),
  
  // Allowed file types
  NEXT_PUBLIC_ALLOWED_FILE_TYPES: (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 
    'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain'
  ).split(','),
};

// Server-side only environment variables
const serverEnv = {
  // API keys and secrets (never exposed to the client)
  API_SECRET_KEY: process.env.API_SECRET_KEY,
  
  // Database connection string
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET,
  
  // External services
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  // Email service
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM,
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
};

// Combine all environment variables
const env = {
  ...clientEnv,
  ...(typeof window === 'undefined' ? serverEnv : {}),
};

/**
 * Get environment variable with type checking
 * @param {string} key - The environment variable key
 * @param {any} defaultValue - Default value if the variable is not set
 * @param {'string'|'number'|'boolean'|'array'|'json'} type - Expected type of the variable
 * @returns {any} The parsed environment variable value
 */
const getEnv = (key, defaultValue = null, type = 'string') => {
  const value = process.env[key];
  
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  try {
    switch (type) {
      case 'number':
        return parseFloat(value) || defaultValue;
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'array':
        return value.split(',').map(item => item.trim());
      case 'json':
        return JSON.parse(value);
      case 'string':
      default:
        return value;
    }
  } catch (error) {
    console.error(`Error parsing environment variable ${key}:`, error);
    return defaultValue;
  }
};

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const requiredVars = [
    'NEXT_PUBLIC_API_BASE_URL',
    'DATABASE_URL',
    'JWT_SECRET',
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

export { clientEnv, serverEnv, getEnv };
export default env;
