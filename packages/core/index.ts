import { Extmod } from "@/util/types";

const extmodTypes = ["json", "client"] as const;
export type ExtmodType = (typeof extmodTypes)[number];

export const extmod: <T extends object>(
  url: string,
  type?: ExtmodType
) => Promise<Extmod<T>> = <T extends object>(url: string, type?: ExtmodType) =>
  (type ? import(url, { assert: { type } }) : import(url)) as Promise<
    Extmod<T>
  >;

export const extmodEval: <T extends object>(
  url: string,
  type?: ExtmodType
) => Promise<Extmod<T>> = <T extends object>(url: string, type?: ExtmodType) =>
  (0, eval)(
    `import("${url}", ${JSON.stringify(type ? { assert: { type } } : {})})`
  ) as Promise<Extmod<T>>;
