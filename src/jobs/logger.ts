const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Simple logger interface that uses console in production
 * and pino-pretty in development for enhanced formatting
 */
interface Logger {
  info: (data: Record<string, unknown> | string, msg?: string) => void;
  warn: (data: Record<string, unknown> | string, msg?: string) => void;
  error: (data: Record<string, unknown> | string, msg?: string) => void;
  debug: (data: Record<string, unknown> | string, msg?: string) => void;
  child: (bindings: Record<string, unknown>) => Logger;
}

function createLogger(bindings: Record<string, unknown> = {}): Logger {
  const formatMessage = (data: Record<string, unknown> | string, msg?: string) => {
    const prefix = Object.keys(bindings).length > 0 ? `[${Object.values(bindings).join(":")}]` : "";

    if (typeof data === "string") {
      return `${prefix} ${data}`;
    }

    const message = msg ? `${prefix} ${msg}` : prefix;
    return { ...bindings, ...data, msg: message } as Record<string, unknown>;
  };

  return {
    info: (data, msg?) => {
      const formatted = formatMessage(data, msg);
      if (typeof formatted === "string") {
        console.info(formatted);
      } else {
        console.info(formatted);
      }
    },
    warn: (data, msg?) => {
      const formatted = formatMessage(data, msg);
      if (typeof formatted === "string") {
        console.warn(formatted);
      } else {
        console.warn(formatted);
      }
    },
    error: (data, msg?) => {
      const formatted = formatMessage(data, msg);
      if (typeof formatted === "string") {
        console.error(formatted);
      } else {
        console.error(formatted);
      }
    },
    debug: (data, msg?) => {
      if (!isDevelopment) return;
      const formatted = formatMessage(data, msg);
      if (typeof formatted === "string") {
        console.debug(formatted);
      } else {
        console.debug(formatted);
      }
    },
    child: (childBindings) => createLogger({ ...bindings, ...childBindings }),
  };
}

export const logger = createLogger();

/**
 * Child logger for job queue operations
 */
export const jobLogger = logger.child({ component: "job-queue" });

/**
 * Child logger for worker pool operations
 */
export const workerLogger = logger.child({ component: "worker-pool" });

/**
 * Child logger for parse pipeline operations
 */
export const parseLogger = logger.child({ component: "parse-pipeline" });
