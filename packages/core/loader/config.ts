import { cleanEnv, num, str } from "envalid";

export default cleanEnv(process.env, {
  EXTMOD_LOG_LEVEL: str({
    choices: ["debug", "info", "warn", "error"],
  }),
  EXTMOD_LOG_TYPE: str({
    choices: ["console", "json"],
  }),
  EXTMOD_RESOLVER_TIMEOUT_MS: num(),
  EXTMOD_LOADER_TIMEOUT_MS: num(),
});
