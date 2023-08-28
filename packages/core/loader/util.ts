export const time: <T>(
  fn: () => T | Promise<T>
) => Promise<[number, T]> = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now() - start;

  return [end, result];
};
