import { ExtmodConfig } from "@/util/schema";
import { Command } from "@commander-js/extra-typings";
import { stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const config1_0: ExtmodConfig = {
  version: "1.0",
  aliases: {},
  policy: {
    resources: {},
    scopes: {
      "file:": {
        dependencies: true,
        integrity: true,
      },
    },
  },
};

export default new Command()
  .name("init")
  .summary("Create an empty .extmod.json file")
  .action(async () => {
    try {
      await stat(join(process.cwd(), ".extmod.json"));
    } catch {
      await writeFile(
        join(process.cwd(), ".extmod.json"),
        JSON.stringify(config1_0, null, 2),
        "utf8"
      );
    }
  });
