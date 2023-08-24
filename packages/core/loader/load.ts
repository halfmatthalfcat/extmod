import {
  EXTMOD_ERROR,
  EXTMOD_ERROR_CODE,
  EXTMOD_ERROR_REASON,
  ExtModErrorCodes,
  getErrorReasonFromCode,
} from "@/.";
import g from "@babel/generator";
import * as parser from "@babel/parser";
import * as t from "@babel/types";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, sep } from "node:path";
import config from "./config";
import logger from "./log";
import { extmodUrl, time } from "./util";
// @ts-ignore: babel .d.ts is wrong
// @see: https://github.com/babel/babel/issues/15269
const { default: generate } = g;

const buildError = (code: number) =>
  generate(
    t.exportDefaultDeclaration(
      t.objectExpression([
        t.objectProperty(
          t.stringLiteral(EXTMOD_ERROR),
          t.objectExpression([
            t.objectProperty(
              t.stringLiteral(EXTMOD_ERROR_CODE),
              t.numericLiteral(code)
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

export async function load(
  resolvedUrl: string,
  context: any,
  next: (url: string) => void
) {
  const { error, url } = extmodUrl(new URL(resolvedUrl));
  resolvedUrl = url.href;

  if (["http:", "https:"].includes(url.protocol)) {
    if (error) {
      const errorCode = parseInt(error, 10);
      logger.warn(
        `Recieved error ${errorCode} from resolver for ${resolvedUrl}`,
        {
          fs: "loader",
        }
      );

      return {
        format: "module",
        shortCircuit: true,
        source: buildError(errorCode),
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
            source: buildError(response.status),
          };
        }

        const text = await response.text();
        const {
          program: { sourceType },
        } = parser.parse(text, {
          sourceType: "unambiguous",
        });

        if (sourceType !== "module") {
          console.log(`Fetched resource ${resolvedUrl} is CJS`, {
            fn: "loader",
          });
          return {
            format: "module",
            shortCircuit: true,
            source: buildError(ExtModErrorCodes.EXPECTED_ESM_FOUND_CJS),
          };
        }

        return {
          format: "module",
          shortCircuit: true,
          source: text,
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
            source: buildError(ExtModErrorCodes.LOADER_TIMEOUT),
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
          source: buildError(ExtModErrorCodes.UNEXPECTED_ERROR),
        };
      }
    }
  }

  // We need to check for extensionless bin files manually until Node supports
  // CJS fallback for ESM loaders. This code is ripped from the below, with some modifications.
  // @see https://github.com/orgs/nodejs/discussions/41711
  const ext = extname(url.pathname).slice(1);
  if (!ext) return loadBin(url, context, next);
  else if (["js", "mjs"].includes(ext)) {
    // Check to see if source is ESM or CJS
    const file = await readFile(url, { encoding: "utf-8" });
    const {
      program: { sourceType },
    } = parser.parse(file, {
      sourceType: "unambiguous",
    });

    return {
      format: sourceType === "module" ? "module" : "commonjs",
      shortCircuit: true,
      source: file,
    };
  }

  return next(resolvedUrl);
}

async function loadBin(
  url: URL,
  // @ts-ignore
  context,
  next: (url: string, context: unknown) => void
) {
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
}
