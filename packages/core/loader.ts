import g from "@babel/generator";
import * as parser from "@babel/parser";
import * as t from "@babel/types";
import TTLCache from "@isaacs/ttlcache";
import ccp from "cache-control-parser";
import { getReasonPhrase } from "http-status-codes";
import { resolve as imr } from "import-meta-resolve";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, sep } from "node:path";
import { EXTMOD_ERROR, EXTMOD_ERROR_CODE, EXTMOD_ERROR_REASON } from ".";
import { ExtModErrorCodes, ExtModErrorReasons } from "./index";
const { parse: ccParse } = ccp;
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

const ttlCacheMap = new TTLCache<string, number>();

export async function resolve(
  specifier: string,
  context: any,
  next: (specifier: string, context: any) => void
) {
  if (/^http?/.test(specifier)) {
    const url = new URL(specifier);
    try {
      const response = await fetch(specifier, {
        signal: AbortSignal.timeout(300 * 1000),
        method: "HEAD",
      });

      const etag = response.headers.get("etag");
      const cc = response.headers.get("cache-control");

      const existingTtl = ttlCacheMap.get(specifier);

      if (etag) {
        url.searchParams.set("__extmod_etag", etag);
        return {
          url: url.href,
          shortCircuit: true,
        };
      }

      if (existingTtl != null) {
        url.searchParams.set("__extmod_ttl", existingTtl.toString());
        return {
          url: url.href,
          shortCircuit: true,
        };
      }

      if (cc) {
        const { "max-age": maxAge } = ccParse(cc);

        if (maxAge != null && maxAge !== 0) {
          const insertionTime = Date.now();
          ttlCacheMap.set(specifier, insertionTime, { ttl: maxAge * 1000 });
          url.searchParams.set("__extmod_ttl", insertionTime.toString());
          return {
            url: url.href,
            shortCircuit: true,
          };
        }
      }
    } catch {}
    // If this is a bare module specifier, try to resolve the full path
  } else if (!/.+:/.test(specifier)) {
    try {
      // @ts-ignore
      const modulePath = imr(specifier, import.meta.url);

      if (modulePath) {
        // @ts-ignore
        return {
          url: modulePath,
          shortCircuit: true,
        };
      }
    } catch {}
  }

  return next(specifier, context);
}

export async function load(
  resolvedUrl: string,
  context: any,
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
