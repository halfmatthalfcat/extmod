import { Extmod } from "@/util/types";

const extmodTypes = ["json", "bundle", "client"] as const;
export type ExtmodType = (typeof extmodTypes)[number];

export const extmod: <Module extends Record<string, any>>(
  url: string,
  type?: ExtmodType
) => Promise<Extmod<Module>> = <Module extends Record<string, any>>(
  url: string,
  type?: ExtmodType
) =>
  (0, eval)(
    `import("${url}"${
      type && extmodTypes.includes(type)
        ? `, ${JSON.stringify({
            assert: { type },
          })}`
        : ""
    })`
  ) as Promise<Extmod<Module>>;
