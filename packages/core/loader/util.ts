import { writeFile as fsWriteFile, mkdir } from "node:fs/promises";
import { basename } from "node:path";

export const time: <T>(
  fn: () => T | Promise<T>
) => Promise<[number, T]> = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now() - start;

  return [end, result];
};

export type TupleTail<T> = T extends [infer H, ...infer T] ? T : never;

export const writeFile = async (
  ...params: [string, ...TupleTail<Parameters<typeof fsWriteFile>>]
) => {
  const [path] = params;
  await mkdir(path.replace(basename(path), ""), { recursive: true });
  return fsWriteFile(...params);
};
