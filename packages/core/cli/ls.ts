import { ExtmodConfig, validate } from "@/schema";
import { Command } from "@commander-js/extra-typings";
import { readFile, stat } from "node:fs/promises";

// @ts-ignore
const program = new Command()
  .name("ls")
  .description(
    "List current remote modules and/or directories currently applied."
  )
  .summary("List current modules and/or directories")
  .option(
    "-p, --path <path>",
    "The path to an existing .extmod.json config file.",
    `${process.cwd()}/.extmod.json`
  )
  .action(async ({ path }) => {
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

      if (Object.keys(config.policy.resources).length) {
        const table = Object.keys(config.policy.resources)
          .filter((resource) => resource.startsWith("http"))
          .map((resource) => ({
            resource,
            alias:
              Object.entries(config.aliases).find(
                ([, r]) => r === resource
              )?.[0] ?? "-",
          }));
        console.log("Resources");
        console.table(table, ["resource", "alias"]);
      }

      if (Object.keys(config.policy.scopes).length) {
        const table = Object.keys(config.policy.scopes)
          .filter((resource) => resource.startsWith("http"))
          .map((scope) => ({
            directory: scope + '*',
            alias:
              Object.entries(config.aliases).find(
                ([, r]) => r === scope
              )?.[0] ?? "-",
          }));
        console.log("Directories");
        console.table(table, ["directory", "alias"]);
      }
    } catch (err) {
      return program.error(
        `An error occurred loading config file at ${path}: ${
          err instanceof Error ? err.message : "Unknown"
        }`
      );
    }
  });

export default program;
