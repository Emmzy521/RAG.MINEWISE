/**
 * Logger utility that works in both local development and Firebase Functions
 * Uses console in local dev, firebase-functions/logger in production
 */

// Simple logger that uses console - works in both environments
// In production (Firebase Functions), the console output is captured by the platform
// In local dev, it just uses regular console
const logger = {
  log: (...args: any[]) => console.log(...args),
  info: (...args: any[]) => console.info(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

export default logger;

