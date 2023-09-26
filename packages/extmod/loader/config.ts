import { bool, cleanEnv, num, str } from "envalid";

export default cleanEnv(process.env, {
  EXTMOD_LOG_LEVEL: str({
    choices: ["debug", "info", "warn", "error"],
    default: "info",
  }),
  EXTMOD_LOG_TYPE: str({
    choices: ["console", "json"],
    default: "console",
  }),
  EXTMOD_RESOLVER_TIMEOUT_MS: num({ default: 30000 }),
  EXTMOD_LOADER_TIMEOUT_MS: num({ default: 30000 }),
  EXTMOD_CACHE_DIR: str({ default: ".extmod" }),
  EXTMOD_PERM_CONFIG_URL: str({ default: "" }),
  EXTMOD_IGNORE_WARNINGS: bool({ default: false }),
  EXTMOD_IN_CLIENT_PROCESS: bool({ default: false }),
});
