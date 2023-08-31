/// <reference types="typings-esm-loader" />

import {
  EXTMOD_ERROR,
  EXTMOD_ERROR_CODE,
  EXTMOD_ERROR_REASON,
  ExtmodErrorCodes,
  ExtmodInternalError,
  getErrorReasonFromCode,
} from "@/util/error";
import g from "@babel/generator";
import * as parser from "@babel/parser";
import * as t from "@babel/types";
import * as esbuild from "esbuild";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, sep } from "node:path";
import config from "./config";
import EsbuildExtmodCJSToESM from "./esbuild/cjs-to-esm-exports";
import EsbuildExtmodResolver from "./esbuild/extmod-resolver";
import logger from "./log";
import { ExtmodUrl } from "./url";
import { spawn, time, writeFile } from "./util";
// @ts-ignore: babel .d.ts is wrong
// @see: https://github.com/babel/babel/issues/15269
const { default: generate } = g;

const buildError = (code: keyof typeof ExtmodErrorCodes) =>
  generate(
    t.exportDefaultDeclaration(
      t.objectExpression([
        t.objectProperty(
          t.stringLiteral(EXTMOD_ERROR),
          t.objectExpression([
            t.objectProperty(
              t.stringLiteral(EXTMOD_ERROR_CODE),
              typeof code === "number"
                ? t.numericLiteral(code)
                : t.stringLiteral(code)
            ),
            t.objectProperty(
              t.stringLiteral(EXTMOD_ERROR_REASON),
              t.stringLiteral(getErrorReasonFromCode(code))
            ),
          ])
        ),
      ])
    )
  ).code;

const _load: load = async (_resolvedUrl, context, next) => {
  const url = new ExtmodUrl(_resolvedUrl);
  const resolvedUrl = url.toOG().href;

  if (["http:", "https:"].includes(url.protocol)) {
    if (url.hasError()) {
      logger.warn(
        `Recieved error ${url.getError()} from resolver for ${resolvedUrl}`,
        {
          fn: "loader",
        }
      );

      return {
        format: "module",
        shortCircuit: true,
        source: buildError(url.getError()),
        responseURL: url.href,
      };
    } else if (
      (url.hasClient() || context.importAssertions.type === "client") &&
      !config.EXTMOD_IN_CLIENT_PROCESS
    ) {
      logger.debug(
        `Resource ${resolvedUrl} imported with client assertion and is the root client entrypoint - beginning bundling`,
        {
          fn: "loader",
        }
      );

      // There isn't a good way within the main loader to wait until a entire
      // import tree has resolved, which we need to do to bundle the client chunk.
      // This basically replicates it by spawning an import process wholesale against
      // the head of our client chunk levarging this same loader.
      const [importMs] = await time(() =>
        spawn(
          "node",
          [
            `--experimental-policy=${config.EXTMOD_PERM_CONFIG_URL}`,
            `--experimental-loader=${import.meta.url}`,
            ...(config.EXTMOD_IGNORE_WARNINGS ? ["--no-warnings"] : []),
            "-e",
            `import("${new ExtmodUrl(url.toOG()).setBundle(true).href}")`,
          ],
          {
            stdio: "inherit",
            env: {
              ...process.env,
              EXTMOD_IN_CLIENT_PROCESS: "true",
            },
          }
        )
      );

      logger.debug(
        `Client bundle import resolution for ${resolvedUrl} complete (${importMs.toFixed(
          2
        )}ms)`,
        {
          fn: "loader",
        }
      );

      let path = join(config.EXTMOD_CACHE_DIR, url.pathname);
      const ext = extname(path);
      if (!ext || ![".js", ".mjs"].includes(ext)) {
        path = join(path, "index.mjs");
      }

      const [
        bundleMs,
        {
          outputFiles: [{ contents: source }],
        },
      ] = await time(() =>
        esbuild.build({
          entryPoints: [path],
          bundle: true,
          write: false,
          platform: "browser",
          format: "esm",
          jsx: "automatic",
          plugins: [EsbuildExtmodCJSToESM, EsbuildExtmodResolver],
        })
      );

      console.log(new TextDecoder().decode(source));

      logger.debug(
        `Client bundle esbuild for ${resolvedUrl} complete (${bundleMs.toFixed(
          2
        )}ms)`,
        {
          fn: "loader",
        }
      );

      return {
        format: "module",
        source,
        shortCircuit: true,
        responseURL: url.setBundle(true).href,
      };
    } else {
      try {
        logger.info(`Fetching resource for ${resolvedUrl}`, { fn: "loader" });
        const [ms, response] = await time(() =>
          fetch(url, {
            signal: AbortSignal.timeout(config.EXTMOD_LOADER_TIMEOUT_MS),
          })
        );
        logger.info(`Fetched resource ${resolvedUrl} (${+ms.toFixed(2)}ms)`, {
          fn: "loader",
        });

        if (!response.ok) {
          logger.error(
            `Failed to fetch resource ${resolvedUrl} with code ${response.status}`,
            { fn: "loader" }
          );
          return {
            format: "module",
            shortCircuit: true,
            source: buildError(
              `L${response.status}` as keyof typeof ExtmodErrorCodes
            ),
            responseURL: url.href,
          };
        }

        const text = await response.text();
        let { program } = parser.parse(text, {
          sourceType: "unambiguous",
          plugins: [["importAttributes", { deprecatedAssertSyntax: true }]],
        });
        const { sourceType, directives } = program;

        if (sourceType !== "module") {
          logger.log(`Fetched resource ${resolvedUrl} is CJS`, {
            fn: "loader",
          });
          return {
            format: "module",
            shortCircuit: true,
            source: buildError(ExtmodInternalError.EXPECTED_ESM_FOUND_CJS),
            responseURL: url.href,
          };
        }

        const isUseClient = directives.some(
          (d) => d.value.value === "use client"
        );
        const assertUseClient = context.importAssertions.type === "client";

        if (
          (isUseClient || assertUseClient) &&
          !config.EXTMOD_IN_CLIENT_PROCESS
        ) {
          logger.debug(
            `Resource ${resolvedUrl} imported with client ${
              isUseClient ? "intention" : "assertion"
            } and is the root client entrypoint - beginning bundling`,
            {
              fn: "loader",
            }
          );

          return _load(url.setClient(true).href, context, next);
        } else if (config.EXTMOD_IN_CLIENT_PROCESS) {
          logger.debug(
            `Resource ${resolvedUrl} imported with client ${
              isUseClient ? "intention" : "assertion"
            }`,
            {
              fn: "loader",
            }
          );

          program = {
            ...program,
            directives: isUseClient
              ? directives
              : [...directives, t.directive(t.directiveLiteral("use client"))],
          };

          let path = join(config.EXTMOD_CACHE_DIR, url.pathname);
          const ext = extname(path);

          if (!ext || ![".js", ".mjs"].includes(ext)) {
            path = join(path, "index.mjs");
          }

          const code = generate(program, {
            importAttributesKeyword: "assert",
          }).code;

          await writeFile(path, code);

          const localFile = ExtmodUrl.withProtocol("file://", path).href;

          const { source } = await next(localFile, {
            ...context,
            format: "module",
            importAssertions: {},
          });

          logger.debug(
            `Finished loading ${resolvedUrl} on local file ${localFile}`,
            {
              fn: "loader",
            }
          );

          return {
            format: "module",
            shortCircuit: true,
            source,
            responseURL: url.href,
          };
        }

        return {
          format: "module",
          shortCircuit: true,
          source: generate(program, {
            importAttributesKeyword: "assert",
          }).code,
          responseURL: url.href,
        };
      } catch (ex) {
        if (ex instanceof Error && ex.name === "AbortError") {
          logger.error(
            `Timed out (${config.EXTMOD_LOADER_TIMEOUT_MS}ms) resolving module for ${resolvedUrl}`,
            {
              fn: "loader",
            }
          );
          return {
            format: "module",
            shortCircuit: true,
            source: buildError(ExtmodInternalError.LOADER_FETCH_TIMEOUT),
            responseURL: url.href,
          };
        } else if (
          ex instanceof Error &&
          ["TypeError", "SystemError"].includes(ex.name)
        ) {
          logger.error(
            `Caught fetch error resolving ${resolvedUrl}: ${
              (ex as unknown as any).code ??
              (ex as unknown as any).cause?.code ??
              ex.message
            }`,
            {
              fn: "loader",
            }
          );
          return {
            format: "module",
            shortCircuit: true,
            source: buildError(ExtmodInternalError.LOADER_FETCH_ERROR),
            responseURL: url.href,
          };
        } else if (ex instanceof Error) {
          logger.error(
            `Caught unexpected error resolving ${resolvedUrl}: ${ex.message}`,
            {
              fn: "loader",
            }
          );
        } else {
          logger.error(`Caught unexpected error resolving ${resolvedUrl}`, {
            fn: "loader",
          });
        }

        return {
          format: "module",
          shortCircuit: true,
          source: buildError(ExtmodInternalError.UNEXPECTED_ERROR),
          responseURL: url.href,
        };
      }
    }
  }

  // We need to check for extensionless bin files manually until Node supports
  // CJS fallback for ESM loaders. This code is ripped from the below, with some modifications.
  // @see https://github.com/orgs/nodejs/discussions/41711
  const ext = extname(url.pathname).slice(1);
  if (!ext) return loadBin(url.toOG().href, context, next);
  else if (["js", "mjs"].includes(ext)) {
    // Check to see if source is ESM or CJS
    const file = await readFile(url, { encoding: "utf-8" });
    const {
      program: { sourceType },
    } = parser.parse(file, {
      sourceType: "unambiguous",
    });

    if (sourceType === "script") {
      try {
        const { source } = await next(url.toOG().href, {
          format: "commonjs",
        });

        return {
          source,
          shortCircuit: true,
          format: "commonjs",
        };
      } catch (ex) {
        console.log({ ex });
      }
    }

    return {
      format: sourceType === "module" ? "module" : "commonjs",
      shortCircuit: true,
      source: file,
    };
  }

  return next(_resolvedUrl, context);
};

const loadBin: load = async (responseURL, context, next) => {
  const url = new URL(responseURL);
  const dirs = dirname(url.pathname).split(sep);
  const parentDir = dirs.at(-1);
  const nodeModDir = dirs.indexOf("node_modules");

  let format;

  if (parentDir === "bin" && nodeModDir >= 0) {
    const { type } = await readFile(
      join("/", ...dirs.slice(0, nodeModDir + 2), "package.json"),
      { encoding: "utf-8" }
    ).then(JSON.parse);

    format = type === "module" ? "module" : "commonjs";
  }

  return next(url.href, {
    ...context,
    format,
  });
};

export default async <P extends Parameters<load>>(
  ...params: P
): ReturnType<load> => {
  const [resolvedUrl, ...rest] = params;
  logger.debug(
    // @ts-ignore
    `Loading ${resolvedUrl}`,
    {
      fn: "loader",
    }
  );
  const [ms, result] = await time(() => _load(resolvedUrl, ...rest));
  logger.debug(
    // @ts-ignore
    `Loaded ${result.responseURL ?? resolvedUrl} took ${ms.toFixed(2)}ms`,
    {
      fn: "loader",
    }
  );
  return result;
};
