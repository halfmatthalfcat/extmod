import { ExtmodConfig, validate } from "@/util/schema";
import {
  Command,
  InvalidOptionArgumentError,
  Option,
} from "@commander-js/extra-typings";
import { resolve } from "import-meta-resolve";
import { spawn } from "node:child_process";
import { readFile, stat, unlink, writeFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { temporaryFile } from "tempy";

// @ts-ignore
const program = new Command()
  .name("run")
  .usage(
    "[options] <command...> (e.g. extmod run next dev, exmod run index.js)"
  )
  .summary("Run Node with extmod")
  .description("Run a Node command leveraging a given extmod configuration")
  .argument("<command...>", "The Node command to run")
  .option(
    "-p, --path <path>",
    "The path to an existing .extmod.json config file.",
    `${process.cwd()}/.extmod.json`
  )
  .option(
    "--resolverTimeoutMs <timeout>",
    "Timeout, in ms, for resolving a remote module",
    (value) =>
      /\d+/.test(value)
        ? value
        : (() => {
            throw new InvalidOptionArgumentError(
              "Resolver timeout must be a number"
            );
          })(),
    "30000"
  )
  .option(
    "--loaderTimeoutMs <timeout>",
    "Timeout, in ms, for loading a remote module",
    (value) =>
      /\d+/.test(value)
        ? value
        : (() => {
            throw new InvalidOptionArgumentError(
              "Loader timeout must be a number"
            );
          })(),
    "30000"
  )
  .option(
    "--cacheDir <cacheDir>",
    "A directory to store fetched, remote modules (typically for bundling). Must be an absolute path.",
    (value) =>
      isAbsolute(value)
        ? value
        : (() => {
            throw new InvalidOptionArgumentError(
              `${value} must be an aboslute path.`
            );
          })(),
    `${process.cwd()}/.extmod`
  )
  .addOption(
    new Option(
      "-ll, --logLevel <level>",
      "Change the log level for the ESM module loader"
    )
      .choices(["debug", "info", "warn", "error"])
      .default("info")
  )
  .addOption(
    new Option(
      "-lo, --logOutput <outputType>",
      "Emit ESM loader logs in either text or json foramt"
    )
      .choices(["text", "json"])
      .default("text")
  )
  .option(
    "--ignoreWarnings",
    "Node emits warnings about using experimental features. Use this flag to disable them."
  )
  .action(
    async (
      command,
      {
        path,
        ignoreWarnings,
        loaderTimeoutMs,
        resolverTimeoutMs,
        logOutput,
        logLevel,
        cacheDir,
      }
    ) => {
      try {
        await stat(path);
      } catch {
        return program.error(
          `Could not find configuration file at ${path}. Have you ran "extmod init"?`
        );
      }

      try {
        const file = await readFile(path, { encoding: "utf-8" });
        const config = JSON.parse(file) as ExtmodConfig;
        const errors = await validate(config);

        if (errors.length) {
          return program.error(
            `Configuration file (${path}) is not valid: \n${errors
              .map((err) => `\t- ${err}`)
              .join("\n")}`
          );
        }

        let loader: string;

        try {
          // @ts-ignore
          loader = resolve("@extmod/core/loader", import.meta.url).replace(
            "file://",
            ""
          );
        } catch {
          return program.error(
            `Unable to find @extmod/core/loader, terminating.`
          );
        }

        const tempConfig = temporaryFile({ extension: "json" });
        await writeFile(tempConfig, JSON.stringify(config.policy, null, 2));

        let [c, ...rest] = command;

        const isLocalFile = await stat(`${process.cwd()}/${c}`)
          .catch(() => false)
          .then((f) => !!f);

        // Try to resolve the bin path
        if (!isLocalFile) {
          try {
            const modPkgJsonPath = resolve(
              `${c}/package.json`,
              // @ts-ignore
              import.meta.url
            ).replace("file://", "");
            const modPkgJson = await readFile(modPkgJsonPath, {
              encoding: "utf-8",
            });
            const { bin } = JSON.parse(modPkgJson);

            if (c in bin) {
              c = join("/", ...modPkgJsonPath.split("/").slice(0, -1), bin[c]);
            } else {
              return program.error(
                `Could not resolve ${command[0]} as a local file or node executable, terminating.`
              );
            }
          } catch {
            return program.error(
              `Could not resolve ${command[0]} as a local file or node executable, terminating.`
            );
          }
        }

        const p = spawn(
          "node",
          [
            `--experimental-policy=${tempConfig}`,
            `--experimental-loader=${loader}`,
            ...(ignoreWarnings ? ["--no-warnings"] : []),
            c,
            ...rest,
          ],
          {
            stdio: "inherit",
            env: {
              ...process.env,
              EXTMOD_LOG_LEVEL: logLevel,
              EXTMOD_LOG_TYPE: logOutput === "text" ? "console" : "json",
              EXTMOD_RESOLVER_TIMEOUT_MS: resolverTimeoutMs,
              EXTMOD_LOADER_TIMEOUT_MS: loaderTimeoutMs,
              EXTMOD_CACHE_DIR: cacheDir,
              EXTMOD_PERM_CONFIG_URL: tempConfig,
              EXTMOD_IGNORE_WARNINGS: (ignoreWarnings ?? false).toString(),
            },
          }
        );

        await new Promise((resolve, reject) => {
          p.on("exit", (code) => {
            if (!code) {
              resolve(void 0);
            } else {
              reject(`${command.join(" ")} exited with code ${code}`);
            }
          });

          p.on("error", reject);
        });

        await unlink(tempConfig);
      } catch (err) {
        return program.error(
          `An error occurred loading config file at ${path}: ${
            err instanceof Error ? err.message : "Unknown"
          }`
        );
      }
    }
  );

export default program;
