import {
  EXTMOD_ERROR_CODE,
  EXTMOD_ERROR_REASON,
  ExtmodErrorCodes,
  getErrorReasonFromCode,
} from "@/util/error";

export const errorSnippet = (code: keyof typeof ExtmodErrorCodes) =>
  `export default {
    ${EXTMOD_ERROR_CODE}: ${code},
    ${EXTMOD_ERROR_REASON}: ${getErrorReasonFromCode(code)},
  };`;
