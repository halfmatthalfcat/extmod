import { Command } from "@commander-js/extra-typings";

import add from "./add";
import remove from "./remove";

export default new Command()
  .name("config")
  .summary("Administer an existing config file")
  .description(
    "Take actions against an existing .extmod.json configuration file."
  )
  .addCommand(add)
  .addCommand(remove)
  .showHelpAfterError();
