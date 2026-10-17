import { pino, type Logger as PinoLogger } from "pino";

export type LogBindings = Record<string, unknown>;

/** Logger port. Call sites bind their own context via `child` and never log PII (bodies, queries, emails). */
export type Logger = {
  info(bindings: LogBindings, message?: string): void;
  warn(bindings: LogBindings, message?: string): void;
  error(bindings: LogBindings, message?: string): void;
  child(bindings: LogBindings): Logger;
};

function wrap(pinoLogger: PinoLogger): Logger {
  return {
    info: (bindings, message) => pinoLogger.info(bindings, message),
    warn: (bindings, message) => pinoLogger.warn(bindings, message),
    error: (bindings, message) => pinoLogger.error(bindings, message),
    child: (bindings) => wrap(pinoLogger.child(bindings)),
  };
}

function pinoOptions(nodeEnv: string | undefined) {
  if (nodeEnv === "test") return { level: "silent" } as const;
  if (nodeEnv === "production") return { level: "info" } as const;
  return {
    level: "debug",
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:HH:MM:ss.l", ignore: "pid,hostname" },
    },
  } as const;
}

let defaultLogger: Logger | null = null;

function get(): Logger {
  defaultLogger ??= wrap(pino(pinoOptions(process.env.NODE_ENV)));
  return defaultLogger;
}

export const AppLogger = { get, wrap };
