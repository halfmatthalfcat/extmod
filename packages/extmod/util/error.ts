export const EXTMOD_ERROR = "__EXTMOD_ERROR";
export const EXTMOD_ERROR_CODE = "code";
export const EXTMOD_ERROR_REASON = "reason";

const HttpStatusCodes = {
  100: "Continue",
  101: "Switching Protocols",
  102: "Processing",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  207: "Multi-Status",
  208: "Already Reported",
  226: "IM Used",
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  306: "Switch Proxy",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Request Entity Too Large",
  414: "Request-URI Too Long",
  415: "Unsupported Media Type",
  416: "Requested Range Not Satisfiable",
  417: "Expectation Failed",
  418: "I'm a teapot",
  420: "Enhance Your Calm",
  421: "Misdirected Request",
  422: "Unprocessable Entity",
  423: "Locked",
  424: "Failed Dependency",
  425: "Unordered Collection",
  426: "Upgrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  444: "No Response",
  449: "Retry With",
  450: "Blocked by Windows Parental Controls",
  451: "Unavailable For Legal Reasons",
  499: "Client Closed Request",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  509: "Bandwidth Limit Exceeded",
  510: "Not Extended",
  511: "Network Authentication Required",
} as const;

export type ResolverHttpError = {
  [K in keyof typeof HttpStatusCodes as `L${K}`]: (typeof HttpStatusCodes)[K];
};

export type LoaderHttpError = {
  [K in keyof typeof HttpStatusCodes as `R${K}`]: (typeof HttpStatusCodes)[K];
};

export const ExtmodInternalError = {
  EXPECTED_ESM_FOUND_CJS: -1,
  RESOLVER_FETCH_TIMEOUT: -2,
  LOADER_FETCH_TIMEOUT: -3,
  RESOLVER_FETCH_ERROR: -4,
  LOADER_FETCH_ERROR: -5,
  RESOLVER_CRITERIA_UNMET: -6,
  UNEXPECTED_ERROR: -99,
} as const;

export const ExtmodInternalErrorCodes = {
  [ExtmodInternalError.EXPECTED_ESM_FOUND_CJS]: "Expected ESM but found CJS",
  [ExtmodInternalError.RESOLVER_FETCH_TIMEOUT]: "Resolving module timed out",
  [ExtmodInternalError.LOADER_FETCH_TIMEOUT]: "Loading module timed out",
  [ExtmodInternalError.RESOLVER_FETCH_ERROR]:
    "Resolving module failed (e.g. networking, malformed url; see error logs)",
  [ExtmodInternalError.LOADER_FETCH_ERROR]:
    "Loading module failed (e.g. networking, malformed url; see error logs)",
  [ExtmodInternalError.RESOLVER_CRITERIA_UNMET]:
    "Resolving module did not met established criteria",
  [ExtmodInternalError.UNEXPECTED_ERROR]:
    "Remote module loading encountered an unexpected error",
} as const;

export const ExtmodErrorCodes = {
  ...ExtmodInternalErrorCodes,
  ...Object.entries(HttpStatusCodes).reduce(
    (acc, [k, v]) => ({
      ...acc,
      [`R${k}`]: v,
    }),
    {} as ResolverHttpError
  ),
  ...Object.entries(HttpStatusCodes).reduce(
    (acc, [k, v]) => ({
      ...acc,
      [`L${k}`]: v,
    }),
    {} as LoaderHttpError
  ),
} as const;

export const getErrorReasonFromCode = (code: keyof typeof ExtmodErrorCodes) => {
  const parsedCode =
    (typeof code === "string" &&
      parseInt(/^[LR](\d+)$/.exec(code)?.[1] ?? "", 10)) ||
    (code as number);

  if (parsedCode > 0) {
    return (
      HttpStatusCodes[code as keyof typeof HttpStatusCodes] ??
      "Unknown HTTP Code"
    );
  } else {
    return (
      ExtmodInternalErrorCodes[code as keyof typeof ExtmodInternalErrorCodes] ??
      "Unknown Loader Code"
    );
  }
};
