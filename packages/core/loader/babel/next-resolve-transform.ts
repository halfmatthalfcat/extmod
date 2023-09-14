/**
 * This is a Next.js specific transform
 * Next uses vendored versions of various things (most notibly React)
 * and also resolves it's bundled modules client-side using it's own
 * wrapper over Webpack's client-side resolve. We need to:
 * (1) Replace the named import with React's client-side specific vendored import
 * (2) Replace the require call with Next's specific require call
 * (2a) Specifically for React 17 JSX helper imports, those need to be converted to
 *      createElement client-side as there is no jsx(DEV) loaded into the client
 */

import g from "@babel/generator";
import * as parser from "@babel/parser";
import trvs from "@babel/traverse";
import * as t from "@babel/types";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire as nodeRequire } from "node:module";
import { relative } from "node:path";
const require = nodeRequire(import.meta.url);
// @ts-ignore: babel .d.ts is wrong
// @see: https://github.com/babel/babel/issues/15269
const { default: generate }: { default: typeof g } = g;
// @ts-ignore: babel .d.ts is wrong
// @see: https://github.com/babel/babel/issues/15269
const { default: traverse }: { default: typeof trvs } = trvs;

export default async (path: string) => {
  const file = await readFile(path.replace("file://", ""), {
    encoding: "utf-8",
  });
  const program = parser.parse(file, {
    sourceType: "unambiguous",
  });

  const { baseOverrides, experimentalOverrides } = await import(
    "next/dist/server/require-hook.js"
  );
  const {
    WEBPACK_LAYERS: { appPagesBrowser },
  } = await import("next/dist/lib/constants.js");
  const effectiveOverrides =
    process.env.__NEXT_PRIVATE_PREBUNDLED_REACT === "next"
      ? baseOverrides
      : experimentalOverrides;

  const getRelativeModulePath = (
    specifier: keyof typeof effectiveOverrides
  ) => {
    try {
      const modulePath = require.resolve(effectiveOverrides[specifier]);
      return relative(process.cwd(), modulePath);
    } catch {
      return specifier;
    }
  };

  traverse(program, {
    CallExpression: (path) => {
      if (
        path.node.callee.type === "Identifier" &&
        path.node.callee.name === "__require" &&
        path.node.arguments[0].type === "StringLiteral"
      ) {
        switch (path.node.arguments[0].value) {
          case "react": {
            const relativeModulePath = getRelativeModulePath("react");
            path.node.callee.name = "window.__next_require__";
            path.node.arguments[0].value = `(${appPagesBrowser})/${relativeModulePath}`;
            break;
          }
          case "react/jsx-dev-runtime":
          case "react/jsx-runtime": {
            const relativeModulePath = getRelativeModulePath("react");
            const mockExports = t.objectExpression([
              t.objectProperty(
                t.identifier("jsxDEV"),
                t.memberExpression(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier("window"),
                      t.identifier("__next_require__")
                    ),
                    [
                      t.stringLiteral(
                        `(${appPagesBrowser})/${relativeModulePath}`
                      ),
                    ]
                  ),
                  t.identifier("createElement")
                )
              ),
              t.objectProperty(
                t.identifier("jsx"),
                t.memberExpression(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier("window"),
                      t.identifier("__next_require__")
                    ),
                    [
                      t.stringLiteral(
                        `(${appPagesBrowser})/${relativeModulePath}`
                      ),
                    ]
                  ),
                  t.identifier("createElement")
                )
              ),
            ]);
            path.replaceWith(mockExports);
          }
        }
      }
    },
  });

  await writeFile(path, generate(program).code);
};
