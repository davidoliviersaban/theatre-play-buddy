const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Simple logger interface that uses console in production
 * and pino-pretty in development for enhanced formatting
 */
interface Logger {
  info: (data: object | string, msg?: string) => void;
  warn: (data: object | string, msg?: string) => void;
  error: (data: object | string, msg?: string) => void;
  debug: (data: object | string, msg?: string) => void;
  child: (bindings: object) => Logger;
}

function createLogger(bindings: object = {}): Logger {
  const formatMessage = (data: object | string, msg?: string) => {
    const prefix = Object.keys(bindings).length > 0
      ? `[${Object.values(bindings).join(":")}]`
      : "";

    if (typeof data === "string") {
      return `${prefix} ${data}`;
    }

    const message = msg ? `${prefix} ${msg}` : prefix;
    return { ...bindings, ...data, msg: message };
  };

  return {
    info: (data, msg?) => {
      const formatted = formatMessage(data, msg);
      if (typeof formatted === "string") {
        console.info(formatted);
      } else {
        console.info(formatted.msg || "", formatted);
      }
    },
    warn: (data, msg?) => {
      const formatted = formatMessage(data, msg);
      if (typeof formatted === "string") {
        console.warn(formatted);
      } else {
        console.warn(formatted.msg || "", formatted);
      }
    },
    error: (data, msg?) => {
      const formatted = formatMessage(data, msg);
      if (typeof formatted === "string") {
        console.error(formatted);
      } else {
        console.error(formatted.msg || "", formatted);
      }
    },
    debug: (data, msg?) => {
      if (!isDevelopment) return;
      const formatted = formatMessage(data, msg);
      if (typeof formatted === "string") {
        console.debug(formatted);
      } else {
        console.debug(formatted.msg || "", formatted);
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
