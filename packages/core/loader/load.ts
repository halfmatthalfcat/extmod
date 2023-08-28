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
import { readFile } from "node:fs/promises";
import { dirname, extname, join, sep } from "node:path";
import config from "./config";
import logger from "./log";
import { ExtmodUrl } from "./url";
import { time } from "./util";
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

const load = async (
  _resolvedUrl: string,
  context: { importAssertions: { type?: string } } = { importAssertions: {} },
  next: (url: string) => Promise<object>
): Promise<object> => {
  console.log(context);
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
          console.log(`Fetched resource ${resolvedUrl} is CJS`, {
            fn: "loader",
          });
          return {
            format: "module",
            shortCircuit: true,
            source: buildError(ExtmodInternalError.EXPECTED_ESM_FOUND_CJS),
            responseURL: url.href,
          };
        }

        if (
          context.importAssertions.type === "client" &&
          directives.every((d) => d.value.value !== "use client")
        ) {
          logger.debug(
            `Resource ${resolvedUrl} imported with client assertion`,
            {
              fn: "loader",
            }
          );

          program = {
            ...program,
            directives: [
              ...program.directives,
              t.directive(t.directiveLiteral("use client")),
            ],
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
  if (!ext) return loadBin(url.toOG(), context, next);
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
};

async function loadBin(
  url: URL,
  // @ts-ignore
  context,
  next: (url: string, context: unknown) => Promise<object>
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

export default async <P extends Parameters<typeof load>>(
  ...params: P
): ReturnType<typeof load> => {
  const [resolvedUrl, ...rest] = params;
  const [ms, result] = await time(() => load(resolvedUrl, ...rest));
  logger.debug(`Loading ${resolvedUrl} took ${ms.toFixed(2)}ms`, {
    fn: "loader",
  });
  return result;
};
