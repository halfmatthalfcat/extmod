import { ExtmodConfig, validate } from "@/util/schema";
import { Command } from "@commander-js/extra-typings";
import { readFile, stat } from "node:fs/promises";

const program = new Command()
  .name("validate")
  .summary("Validate a given .extmod.json configuration file")
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

    const file = await readFile(path, { encoding: "utf-8" });
    const config = JSON.parse(file) as ExtmodConfig;
    const errors = await validate(config);

    if (errors.length) {
      return program.error(
        `Configuration file (${path}) is not valid: \n${errors
          .map((err) => `\t- ${err}`)
          .join("\n")}`
      );
    } else {
      console.log("Configuration valid.");
    }
  });

export default program;
