/* 通用Logger封装 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const configuredLevel = process.env.LOG_LEVEL || "info";
const threshold = LEVELS[configuredLevel] || LEVELS.info;

function serializeError(error) {
  if (!error) return undefined;
  return {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  };
}

function write(level, event, context = {}) {
  if (LEVELS[level] < threshold) return;
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

const logger = {
  debug: (event, context) => write("debug", event, context),
  info: (event, context) => write("info", event, context),
  warn: (event, context) => write("warn", event, context),
  error: (event, context = {}) => {
    const { error, ...rest } = context;
    write("error", event, { ...rest, error: serializeError(error) });
  },
};

module.exports = { logger, serializeError };
