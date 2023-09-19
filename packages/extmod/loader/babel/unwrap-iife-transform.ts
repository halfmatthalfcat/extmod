/**
 * We need to unwrap the IIFE created by esbuild into just a regular function
 * in order to control when we load our module client-side
 */

import g from "@babel/generator";
import * as parser from "@babel/parser";
import trvs from "@babel/traverse";
import * as t from "@babel/types";
import { readFile, writeFile } from "node:fs/promises";
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

  traverse(program, {
    ExpressionStatement: (path) => {
      // Looking only for top-level iife assignments
      if (
        path.parent.type === "Program" &&
        path.node.expression.type === "AssignmentExpression" &&
        path.node.expression.right.type === "CallExpression" &&
        ["ArrowFunctionExpression", "FunctionExpression"].includes(
          path.node.expression.right.callee.type
        )
      ) {
        path.node.expression.right = path.node.expression.right
          .callee as t.Expression;
      }
    },
  });

  await writeFile(path, generate(program).code);
};
