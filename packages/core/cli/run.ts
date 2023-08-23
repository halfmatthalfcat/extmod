import { ExtmodConfig, validate } from "@/schema";
import { Command } from "@commander-js/extra-typings";
import { resolve } from "import-meta-resolve";
import { spawn } from "node:child_process";
import { readFile, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
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
  .action(async (command, { path }) => {
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
          // @ts-ignore
          const modPkgJsonPath = resolve(
            `${c}/package.json`,
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

      console.log("node", [
        `--experimental-policy=${tempConfig}`,
        `--experimental-loader=${loader}`,
        c,
        ...rest,
      ]);

      const p = spawn(
        "node",
        [
          `--experimental-policy=${tempConfig}`,
          `--experimental-loader=${loader}`,
          c,
          ...rest,
        ],
        {
          stdio: "inherit",
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
  });

export default program;
