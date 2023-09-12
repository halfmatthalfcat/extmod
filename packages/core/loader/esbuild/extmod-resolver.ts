import { Plugin } from "esbuild";
import { extname, join, resolve } from "node:path";
import config from "../config";
import logger from "../log";

export default {
  name: "extmod-resolver",
  setup: (build) => {
    // Resolve absolute imports to the cache directory
    build.onResolve({ filter: /^\// }, (args) => {
      const { path, kind } = args;
      if (kind !== "entry-point") {
        const cleanedPath = join(
          config.EXTMOD_CACHE_DIR,
          path.replace(config.EXTMOD_CACHE_DIR, "")
        );
        logger.debug(
          `Found absolute import ${path}, resolving to ${cleanedPath}`,
          {
            fn: "esb-resolver",
          }
        );
        return {
          path: cleanedPath,
        };
      } else {
        return {
          path,
        };
      }
    });

    // Resolve http imports to cache dir (as they should be already cached)
    build.onResolve({ filter: /^https?/ }, (args) => {
      const url = new URL(args.path);
      let path = url.pathname;

      const ext = extname(path);
      if (!ext || ![".js", ".mjs"].includes(ext)) {
        path = join(path, "index.mjs");
      }

      logger.debug(
        `Found http import ${args.path}, resolving to ${join(
          config.EXTMOD_CACHE_DIR,
          path
        )}`,
        {
          fn: "esb-resolver",
        }
      );

      return {
        path: join(config.EXTMOD_CACHE_DIR, path),
      };
    });

    // Externalize bare imports
    build.onResolve({ filter: /^[^\/]/ }, (args) => {
      return {
        path: args.path,
        external: true,
      };
    });

    // Resolve relative imports
    build.onResolve({ filter: /^\./ }, (args) => {
      const { path } = args;
      const resolvedPath = resolve(process.cwd(), path);

      return {
        path: resolvedPath,
        namespace: "file",
        external: true,
      };
    });
  },
} as Plugin;
