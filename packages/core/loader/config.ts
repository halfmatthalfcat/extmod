import { bool, cleanEnv, num, str } from "envalid";

export default cleanEnv(process.env, {
  EXTMOD_LOG_LEVEL: str({
    choices: ["debug", "info", "warn", "error"],
  }),
  EXTMOD_LOG_TYPE: str({
    choices: ["console", "json"],
  }),
  EXTMOD_RESOLVER_TIMEOUT_MS: num(),
  EXTMOD_LOADER_TIMEOUT_MS: num(),
  EXTMOD_CACHE_DIR: str({ default: ".extmod" }),
  EXTMOD_PERM_CONFIG_URL: str(),
  EXTMOD_IGNORE_WARNINGS: bool({ default: false }),
  EXTMOD_IN_CLIENT_PROCESS: bool({ default: false }),
});
