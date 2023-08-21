import { Command } from "@commander-js/extra-typings";
import { statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ExtmodConfig } from "../schema";

const config1_0: ExtmodConfig = {
  version: '1.0',
  aliases: {},
  policy: {
    resources: {},
    scopes: {
      "file:": {
        dependencies: true,
      },
    },
  },
};

export default new Command()
  .name("init")
  .summary("Create an empty .extmod.json file")
  .action(() => {
    try {
      statSync(join(process.cwd(), ".extmod.json"));
    } catch {
      writeFileSync(
        join(process.cwd(), ".extmod.json"),
        JSON.stringify(config1_0, null, 2),
        "utf8"
      );
    }
  });