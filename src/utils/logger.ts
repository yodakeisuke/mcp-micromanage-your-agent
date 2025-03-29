import chalk from 'chalk';


export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// 現在のログレベル（デフォルトはINFO）
let currentLogLevel = LogLevel.INFO;

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

function getTimestamp(): string {
  const now = new Date();
  return `[${now.toISOString().replace('T', ' ').substring(0, 19)}]`;
}

export function debug(message: string, ...args: any[]): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.error(`${getTimestamp()} ${chalk.blue('DEBUG')} ${message}`, ...args);
  }
}

export function info(message: string, ...args: any[]): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.error(`${getTimestamp()} ${chalk.green('INFO')} ${message}`, ...args);
  }
}

export function warn(message: string, ...args: any[]): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.warn(`${getTimestamp()} ${chalk.yellow('WARN')} ${message}`, ...args);
  }
}

export function error(message: string, ...args: any[]): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.error(`${getTimestamp()} ${chalk.red('ERROR')} ${message}`, ...args);
  }
}

export function logError(message: string, error: unknown): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.error(`${getTimestamp()} ${chalk.red('ERROR')} ${message}: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(`${getTimestamp()} ${chalk.red('STACK')} ${error.stack}`);
    }
  }
}

// デフォルトエクスポート
export default {
  setLogLevel,
  getLogLevel,
  debug,
  info,
  warn,
  error,
  logError,
  LogLevel
}; 