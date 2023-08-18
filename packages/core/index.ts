import { ReasonPhrases, StatusCodes } from "http-status-codes";

export const EXTMOD_ERROR = "__EXTMOD_ERROR";
export const EXTMOD_ERROR_CODE = "code";
export const EXTMOD_ERROR_REASON = "reason";

enum ExtModInternalErrorCodes {
  EXPECTED_ESM_FOUND_CJS = -1,
  FETCH_TIMEOUT = -2,
  UNEXPECTED_ERROR = -99,
}

enum ExtModInternalErrorReasons {
  EXPECTED_ESM_FOUND_CJS = "Expected ESM but found CJS",
  FETCH_TIMEOUT = "Fetching module timed out",
  UNEXPECTED_ERROR = "Remote module loading encountered an unexpected error",
}

export const ExtModErrorCodes = {
  ...ExtModInternalErrorCodes,
  ...StatusCodes,
} as const;
export type ExtModErrorCodes = Exclude<
  (typeof ExtModErrorCodes)[keyof typeof ExtModErrorCodes],
  string
>;

export const ExtModErrorReasons = {
  ...ExtModInternalErrorReasons,
  ...ReasonPhrases,
} as const;
export type ExtModErrorReasons =
  (typeof ExtModErrorReasons)[keyof typeof ExtModErrorReasons];

export type ExtModErrorCode = Exclude<
  (typeof ExtModErrorCodes)[keyof typeof ExtModErrorCodes],
  string
>;

export type ExtMod<T extends object> = T & {
  [EXTMOD_ERROR]?: {
    [EXTMOD_ERROR_CODE]: ExtModErrorCode;
    [EXTMOD_ERROR_REASON]: ExtModErrorReasons;
  };
};
