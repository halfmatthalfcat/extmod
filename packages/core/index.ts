import { Extmod } from "@/util/types";

export const extmod: <T extends object>(url: string) => Promise<Extmod<T>> = <
  T extends object
>(
  url: string
) => import(url) as Promise<Extmod<T>>;

export const extmodEval: <T extends object>(
  url: string
) => Promise<Extmod<T>> = <T extends object>(url: string) =>
  (0, eval)(`import("${url}")`) as Promise<Extmod<T>>;
