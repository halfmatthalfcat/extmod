import { ReasonPhrases, StatusCodes, getReasonPhrase } from "http-status-codes";

export const EXTMOD_ERROR = "__EXTMOD_ERROR";
export const EXTMOD_ERROR_CODE = "code";
export const EXTMOD_ERROR_REASON = "reason";

enum ExtModInternalErrorCodes {
  EXPECTED_ESM_FOUND_CJS = -1,
  RESOLVER_TIMEOUT = -2,
  LOADER_TIMEOUT = -3,
  RESOLVER_CRITERIA_UNMET = -4,
  UNEXPECTED_ERROR = -99,
}

enum ExtModInternalErrorReasons {
  EXPECTED_ESM_FOUND_CJS = "Expected ESM but found CJS",
  RESOLVER_TIMEOUT = "Resolving module timed out",
  LOADER_TIMEOUT = "Loading module timed out",
  RESOLVER_CRITERIA_UNMET = "Resolving module did not met established criteria",
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

export const getErrorReasonFromCode = (code: ExtModErrorCodes) => {
  try {
    if (code > 0) return getReasonPhrase(code);
    else
      return (
        ExtModInternalErrorReasons[
          ExtModInternalErrorCodes[
            code
          ] as keyof typeof ExtModInternalErrorReasons
        ] ?? "Unknown error Reason"
      );
  } catch {
    return "Unknown Error Reason";
  }
};

export type ExtMod<T extends object> = T & {
  [EXTMOD_ERROR]?: {
    [EXTMOD_ERROR_CODE]: ExtModErrorCode;
    [EXTMOD_ERROR_REASON]: ExtModErrorReasons;
  };
};
