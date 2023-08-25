#!/usr/bin/env node

import { version } from "@/package.json";
import { Command } from "@commander-js/extra-typings";
const program = new Command();

import config from "./config";
import init from "./init";
import ls from "./ls";
import run from "./run";
import validate from "./validate";

program
  .name("extmod")
  .description(
    "Dynamically pull remote ESM modules in Node, ala Federated Modules"
  )
  .version(version)
  .addCommand(init)
  .addCommand(ls)
  .addCommand(config)
  .addCommand(run)
  .addCommand(validate);

await program.parseAsync();
