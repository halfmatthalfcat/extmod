import {
  EXTMOD_ERROR,
  EXTMOD_ERROR_CODE,
  EXTMOD_ERROR_REASON,
  ExtModErrorCodes,
} from "./error";

export type ExtMod<T extends object> = T & {
  [EXTMOD_ERROR]?: {
    [EXTMOD_ERROR_CODE]: keyof typeof ExtModErrorCodes;
    [EXTMOD_ERROR_REASON]: (typeof ExtModErrorCodes)[keyof typeof ExtModErrorCodes];
  };
};
