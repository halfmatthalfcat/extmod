import generate from "@babel/generator";
import * as parser from "@babel/parser";
import * as t from "@babel/types";
import {
  EXTMOD_ERROR,
  EXTMOD_ERROR_CODE,
  EXTMOD_ERROR_REASON,
} from ".";
import { ExtModErrorCodes, ExtModErrorReasons } from "./index";
import { getReasonPhrase } from "http-status-codes";

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

export async function load(url: string, _, next: (url: string) => void) {
  if (/^https?/.test(url)) {
    try {
      const response = await fetch(url, {
        // timeout defaults to 300 seconds, same as Chrome's default fetch timeout
        signal: AbortSignal.timeout(300 * 1000),
      });

      if (!response.ok) {
        return {
          format: "module",
          shortCircuit: true,
          source: buildError(
            response.status,
            getReasonPhrase(response.status)
          ),
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

  // Let Node.js handle all other URLs.
  return next(url);
}
