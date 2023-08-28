import { config, createLogger, format, transports } from "winston";
import extmodConfig from "./config";
const { combine, timestamp, printf } = format;

const maxLevelWidth = Math.max(
  ...Object.keys(config.npm.levels).map((str) => str.length)
);
const maxFnWidth = Math.max(
  ...["resolver", "loader", "general"].map((str) => str.length)
);

const consoleFormat = printf(
  ({ level, message, timestamp, process, fn }) =>
    `[${timestamp}] [${process}-${(fn ?? "general").padEnd(
      maxFnWidth,
      " "
    )}] [${level.padEnd(maxLevelWidth, " ")}]: ${message}`
);

export default createLogger({
  level: extmodConfig.EXTMOD_LOG_LEVEL,
  levels: config.npm.levels,
  format: combine(
    timestamp(),
    extmodConfig.EXTMOD_LOG_TYPE === "console" ? consoleFormat : format.json()
  ),
  defaultMeta: {
    process: "extmod",
  },
  transports: [new transports.Console()],
});
