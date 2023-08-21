import { EXTMOD_ERROR } from "@extmod/core";
import { strict as assert } from "node:assert";

import cjsModule from "http://localhost:8080/index.js";
const { [EXTMOD_ERROR]: error } = cjsModule;
assert(error != null);

import esmModule from "http://localhost:8080/index.mjs";
assert(typeof esmModule === "function");
