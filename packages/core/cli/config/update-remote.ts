import { ExtmodConfig, validate } from "@/schema";
import { Command, InvalidArgumentError } from "@commander-js/extra-typings";
import { readFile, stat, writeFile } from "node:fs/promises";
import { extname } from "node:path";

// @ts-ignore
const program = new Command()
  .name("update-remote")
  .description(
    "Update a remote module or directory from an existing .extmod.json configuration file."
  )
  .summary("Update a remote module")
  .argument(
    "<remoteUrlOrAlias>",
    "The remote module or directory's fully-qualified URL or a valid alias."
  )
  .argument(
    "<updatedUrl>",
    "The url to replace the currently applied one for the current url or alias.",
    (value) => {
      if (/^https?/.test(value)) {
        return value;
      }

      throw new InvalidArgumentError(`${value} is not a valid URL`);
    }
  )
  .option(
    "-p, --path <path>",
    "The path to an existing .extmod.json config file.",
    `${process.cwd()}/.extmod.json`
  )
  .action(async (remoteUrlOrAlias, updatedUrl, { path }) => {
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

      if (remoteUrlOrAlias in config.aliases) {
        const isFile = !!extname(updatedUrl).slice(1);
        const oldUrl = config.aliases[remoteUrlOrAlias];

        config.aliases[remoteUrlOrAlias] = updatedUrl;

        delete config.policy.resources[oldUrl];
        delete config.policy.scopes[oldUrl];

        if (isFile) {
          config.policy.resources[updatedUrl] = {
            dependencies: true,
            integrity: true,
          };
        } else {
          updatedUrl = updatedUrl.endsWith("/") ? updatedUrl : `${updatedUrl}/`;

          config.policy.scopes[updatedUrl] = {
            dependencies: true,
            integrity: true,
          };
        }
      } else {
        remoteUrlOrAlias = extname(remoteUrlOrAlias).slice(1)
          ? remoteUrlOrAlias
          : `${remoteUrlOrAlias}/`;

        const [alias] =
          Object.entries(config.aliases).find(
            ([, remote]) => remote === remoteUrlOrAlias
          ) ?? [];

        if (remoteUrlOrAlias in config.policy.resources) {
          const { [remoteUrlOrAlias]: existingConfig, ...rest } =
            config.policy.resources;

          config.policy.resources = {
            ...rest,
            [updatedUrl]: existingConfig,
          };
        } else if (remoteUrlOrAlias in config.policy.scopes) {
          updatedUrl = updatedUrl.endsWith("/") ? updatedUrl : `${updatedUrl}/`;

          const { [remoteUrlOrAlias]: existingConfig, ...rest } =
            config.policy.scopes;

          config.policy.scopes = {
            ...rest,
            [updatedUrl]: existingConfig,
          };
        }

        if (alias) {
          config.aliases[alias] = updatedUrl;
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
  });

export default program;
