import * as parser from "@babel/parser";
import { Plugin } from "esbuild";
import { readFile } from "node:fs/promises";
import logger from "../log";
import { cjsEsmWrapper } from "../util";

export default {
  name: "extmod-esm-cjs-wrapper",
  setup: (build) => {
    build.onLoad({ filter: /\.js$/ }, async ({ path }) => {
      const file = await readFile(path.replace("file://", ""), {
        encoding: "utf-8",
      });
      const { program } = parser.parse(file, {
        sourceType: "unambiguous",
      });

      // prior art: https://github.com/addaleax/gen-esm-wrapper/blob/master/gen-esm-wrapper.js
      // prior art: https://github.com/evanw/esbuild/issues/744
      if (program.sourceType === "script") {
        logger.debug(`Found cjs import (${path}), wrapping in esm`, {
          fn: "esb-loader",
        });
        const contents = cjsEsmWrapper(path);

        return {
          contents,
        };
      }
    });
  },
} as Plugin;
