import { Extmod } from "@/util/types";
import { ExtmodUrl } from "@/loader/url";

const extmodTypes = ["json", "ssr", "client"] as const;
export type ExtmodType = (typeof extmodTypes)[number];

export const extmod: <Module extends Record<string, any>>(
  url: string,
) => Promise<Extmod<Module>> = <Module extends Record<string, any>(url: string) =>
  import(url) as Promise<Extmod<Module>>;

export const extmodSSR: <Module extends Record<string, any>>(
  url: string
) => Promise<Extmod<Module>> = <Module extends Record<string, any>>(url: string) =>
  (0, eval)(
    `import("${url}", ${JSON.stringify({ assert: { type: "ssr" } })})`
  ) as Promise<Extmod<Module>>;

export const extmodClient: <ServerModule extends Record<string, any>, SMR, ClientModule = SMR, CMR = SMR>(opts: {
  url: string;
  fallbackFile?: string;
  serverMapFn?: (mod: ServerModule) => SMR;
  clientMapFn?: (mod: ClientModule) => CMR;
}) => Promise<unknown> = ({
  url,
  fallbackFile,
  serverMapFn,
  clientMapFn,
}) => {
  const params = new URLSearchParams();
  
  if (typeof serverMapFn === "function") {
    params.set(ExtmodUrl.CLIENT_SERVER_FN_PARAM, btoa(serverMapFn.toString()));
  }

  if (typeof clientMapFn === "function") {
    params.set(ExtmodUrl.CLIENT_CLIENT_FN_PARAM, btoa(clientMapFn.toString()));
  }
  
  if (typeof fallbackFile === "string") {
    params.set(ExtmodUrl.CLIENT_FALLBACK_URL, fallbackFile);
  }

  return (0, eval)(
    `import("${url}${params.toString()}", ${JSON.stringify({ assert: { type: "ssr" } })})`
  ) as Promise<Extmod<Module>>;
};
