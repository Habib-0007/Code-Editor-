const isDev = import.meta.env.DEV;

type LogLevel = "debug" | "info" | "warn" | "error";

const noop = (..._args: unknown[]) => {};

export const logger = isDev
  ? {
      debug: (...args: unknown[]) => console.debug("[writecode]", ...args),
      info: (...args: unknown[]) => console.info("[writecode]", ...args),
      warn: (...args: unknown[]) => console.warn("[writecode]", ...args),
      error: (...args: unknown[]) => console.error("[writecode]", ...args),
    }
  : {
      debug: noop,
      info: noop,
      warn: (...args: unknown[]) => console.warn("[writecode]", ...args),
      error: (...args: unknown[]) => console.error("[writecode]", ...args),
    };

export function withLog<T>(level: LogLevel, message: string, fn: () => T): T {
  logger[level](message);
  return fn();
}
