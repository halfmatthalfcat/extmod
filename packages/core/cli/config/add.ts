import { ExtmodConfig, validate } from "@/schema";
import { Command, InvalidArgumentError } from "@commander-js/extra-typings";
import { readFile, stat, writeFile } from "node:fs/promises";

const program = new Command()
  .name("add")
  .description(
    `
    Add a new remote module to an existing .extmod.json configuration file.
    This effectively allows a module to be loaded via import() within your application. 
  `
      .trim()
      .split("\n")
      .map((str) => str.trim())
      .join(" ")
  )
  .summary("Add a remote module")
  .argument(
    "<remoteUrl>",
    "The remote module's fully-qualified URL.",
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
  .option(
    "-a, --alias <alias>",
    "Add an alias to the remote module. This is normally helpful when administering long URLs."
  )
  .option(
    "-f, --force",
    "Force the creation/replacement of remote modules and/or aliases to those modules."
  )
  .action(async (remoteUrl, { path, alias, force }) => {
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

      if (!force && remoteUrl in config.policy.resources) {
        return program.error(
          `${remoteUrl} already exists as a remote module in ${path}.`
        );
      }

      if (!force && alias && alias in config.aliases) {
        return program.error(
          `${alias} is already an alias to ${config.aliases[alias]}. Choose another alias or use -f.`
        );
      }

      config.policy.resources[remoteUrl] = {
        dependencies: true,
      };

      if (alias) {
        config.aliases[alias] = remoteUrl;
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
