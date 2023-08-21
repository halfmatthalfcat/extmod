import { Command } from "@commander-js/extra-typings";

export const add = new Command()
  .name("add")
  .description(`
    Add a new remote module to an existing .extmod.json configuration file.
    This effectively allows a module to be loaded via import() within your application. 
  `.trim().split('\n').map(str => str.trim()).join(' '))
  .summary("Add a remote module");

export const remove = new Command()
  .name("remove")
  .description("Remove a remote module from an existing .extmod.json configuration file.")
  .summary("Remove a remote module");

export default new Command()
  .name("config")
  .summary("Administer an existing config file")
  .description("Take actions against an existing .extmod.json configuration file.")
  .addCommand(add)
  .addCommand(remove);