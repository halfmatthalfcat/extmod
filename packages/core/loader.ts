import g from "@babel/generator";
import * as parser from "@babel/parser";
import * as t from "@babel/types";
import { getReasonPhrase } from "http-status-codes";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, sep } from "node:path";
import { EXTMOD_ERROR, EXTMOD_ERROR_CODE, EXTMOD_ERROR_REASON } from ".";
import { ExtModErrorCodes, ExtModErrorReasons } from "./index";
// @ts-ignore: babel .d.ts is wrong
// @see: https://github.com/babel/babel/issues/15269
const { default: generate } = g;

const buildError = (code: number, reason: string) =>
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
              t.stringLiteral(reason)
            ),
          ])
        ),
      ])
    )
  ).code;

export async function load(
  resolvedUrl: string,
  // @ts-ignore
  context,
  next: (url: string) => void
) {
  const url = new URL(resolvedUrl);

  if (["http:", "https:"].includes(url.protocol)) {
    try {
      const response = await fetch(url, {
        // timeout defaults to 300 seconds, same as Chrome's default fetch timeout
        signal: AbortSignal.timeout(300 * 1000),
      });

      if (!response.ok) {
        return {
          format: "module",
          shortCircuit: true,
          source: buildError(response.status, getReasonPhrase(response.status)),
        };
      }

      const text = await response.text();
      const {
        program: { sourceType },
      } = parser.parse(text, {
        sourceType: "unambiguous",
      });

      if (sourceType !== "module") {
        return {
          format: "module",
          shortCircuit: true,
          source: buildError(
            ExtModErrorCodes.EXPECTED_ESM_FOUND_CJS,
            ExtModErrorReasons.EXPECTED_ESM_FOUND_CJS
          ),
        };
      }

      return {
        format: "module",
        shortCircuit: true,
        source: text,
      };
    } catch (ex) {
      if (ex.name === "AbortError") {
        return {
          format: "module",
          shortCircuit: true,
          source: buildError(
            ExtModErrorCodes.FETCH_TIMEOUT,
            ExtModErrorReasons.FETCH_TIMEOUT
          ),
        };
      } else {
        return {
          format: "module",
          shortCircuit: true,
          source: buildError(
            ExtModErrorCodes.UNEXPECTED_ERROR,
            ExtModErrorReasons.UNEXPECTED_ERROR
          ),
        };
      }
    }
  }

  // We need to check for extensionless bin files manually until Node supports
  // CJS fallback for ESM loaders. This code is ripped from the below.
  // @see https://github.com/orgs/nodejs/discussions/41711
  const ext = extname(url.pathname).slice(1);
  if (!ext) return loadBin(url, context, next);
  else if (ext === 'js') {
    // Check to see if source is ESM or CJS
    const file = await readFile(url, { encoding: "utf-8" });
    const {
      program: { sourceType },
    } = parser.parse(file, {
      sourceType: "unambiguous",
    });

    return {
      format: sourceType === 'module' ? 'module' : 'commonjs',
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
