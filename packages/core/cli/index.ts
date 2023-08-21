#!/usr/bin/env node

import { Command } from "@commander-js/extra-typings";
import { version } from "../package.json";
const program = new Command();

import init from './init';
import config from './config';

program
  .name("extmod")
  .description(
    "Dynamically pull remote ESM modules in Node, ala Federated Modules"
  )
  .version(version);

program
  .addCommand(init)
  .addCommand(config);

program.parse();
