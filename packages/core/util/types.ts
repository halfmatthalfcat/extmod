import {
  EXTMOD_ERROR,
  EXTMOD_ERROR_CODE,
  EXTMOD_ERROR_REASON,
  ExtmodErrorCodes,
} from "./error";

export type Extmod<T extends object> = T & {
  [EXTMOD_ERROR]?: {
    [EXTMOD_ERROR_CODE]: keyof typeof ExtmodErrorCodes;
    [EXTMOD_ERROR_REASON]: (typeof ExtmodErrorCodes)[keyof typeof ExtmodErrorCodes];
  };
};
