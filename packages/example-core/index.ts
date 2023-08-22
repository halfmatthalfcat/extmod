import { EXTMOD_ERROR } from "@extmod/core";
import { strict as assert } from "node:assert";

import cjsModule from "http://localhost:53089/index.js";
const { [EXTMOD_ERROR]: error } = cjsModule;
assert(error != null);

import esmModule from "http://localhost:53089/index.mjs";
assert(typeof esmModule === "function");
console.log(esmModule)
