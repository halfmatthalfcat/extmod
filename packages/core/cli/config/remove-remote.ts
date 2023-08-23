import { ExtmodConfig, validate } from "@/schema";
import { Command } from "@commander-js/extra-typings";
import { readFile, stat, writeFile } from "node:fs/promises";
import { extname } from "node:path";

// @ts-ignore
const program = new Command()
  .name("remove-remote")
  .description(
    "Remove a remote module or directory from an existing .extmod.json configuration file."
  )
  .summary("Remove a remote module")
  .argument(
    "<remoteUrlOrAlias>",
    "The remote module or directory's fully-qualified URL or a valid alias."
  )
  .option(
    "-p, --path <path>",
    "The path to an existing .extmod.json config file.",
    `${process.cwd()}/.extmod.json`
  )
  .action(async (remoteUrlOrAlias, { path }) => {
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

      if (
        Object.keys(config.aliases).some((alias) => alias === remoteUrlOrAlias)
      ) {
        const resource = config.aliases[remoteUrlOrAlias];

        delete config.aliases[remoteUrlOrAlias];
        delete config.policy.resources[resource];
        delete config.policy.scopes[resource];
      } else {
        remoteUrlOrAlias = extname(remoteUrlOrAlias).slice(1)
          ? remoteUrlOrAlias
          : `${remoteUrlOrAlias}/`;

        delete config.policy.resources[remoteUrlOrAlias];
        delete config.policy.scopes[remoteUrlOrAlias];

        for (const [alias, resource] of Object.entries(config.aliases)) {
          if (resource === remoteUrlOrAlias) {
            delete config.aliases[alias];
          }
        }
      }

      await writeFile(path, JSON.stringify(config, null, 2));
    } catch (err) {
      return program.error(
        `An error occurred loading config file at ${path}: ${
          err instanceof Error ? err.message : "Unknown"
        }`
      );
    }
  })
  .showHelpAfterError();

export default program;
