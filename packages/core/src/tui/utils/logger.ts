/**
 * Simple logger utility with configurable log levels
 * 
 * Set LOG_LEVEL environment variable to control output:
 * - "debug" - All messages (debug, info, warn, error)
 * - "info"  - Info and above (info, warn, error)
 * - "warn"  - Warnings and errors only
 * - "error" - Errors only
 * - "silent" - No output
 * 
 * Default is "silent" in production, "info" otherwise
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel;
  }
  
  // Default to silent (no logs) unless explicitly set
  return "silent";
}

const currentLevel = getLogLevel();

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) {
      console.log("[DEBUG]", ...args);
    }
  },

  info: (...args: unknown[]) => {
    if (shouldLog("info")) {
      console.log("[INFO]", ...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) {
      console.warn("[WARN]", ...args);
    }
  },

  error: (...args: unknown[]) => {
    if (shouldLog("error")) {
      console.error("[ERROR]", ...args);
    }
  },
};
