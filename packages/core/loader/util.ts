import isValidIdentifier from "is-valid-identifier";
import { spawn as _spawn } from "node:child_process";
import { writeFile as fsWriteFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename } from "node:path";
const require = createRequire(import.meta.url);

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

export const spawn: <T extends Parameters<typeof _spawn>>(
  ...params: T
) => Promise<number> = async (...params) =>
  new Promise((resolve, reject) => {
    const [...p] = params;
    const process = _spawn(...p);
    process.on("exit", (code) => resolve(code ?? -1));
    process.on("error", reject);
  });

export const hasCjsExports = (path: string) => {
  const module = require(path.replace("file://", ""));
  let keys = new Set(Object.getOwnPropertyNames(module));

  keys.delete("__esModule");

  if (typeof module === "function") {
    ["length", "prototype", "name", "caller"].forEach(keys.delete);
  } else if (typeof module !== "object" || module == null) {
    keys.clear();
  }

  return !!keys.size;
}

export const cjsEsmWrapper = (path: string) => {
  const module = require(path.replace("file://", ""));
  let keys = new Set(Object.getOwnPropertyNames(module));

  keys.delete("__esModule");

  if (typeof module === "function") {
    ["length", "prototype", "name", "caller"].forEach(keys.delete);
  } else if (typeof module !== "object" || module == null) {
    keys.clear();
  }

  let output = `import mod from ${JSON.stringify(path)};\n`;

  if ("__esModule" in module && keys.has("default")) {
    output += `export default mod["default"];\n`;
  } else {
    output += "export default mod;\n";
  }

  const validKeys = [...keys].filter((key) => isValidIdentifier(key)).sort();

  if (validKeys.length) {
    output += `export { ${validKeys.join(", ")} } from ${JSON.stringify(
      path
    )};\n`;
  }

  return output;
};
