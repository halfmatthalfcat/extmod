export const EXTMOD_RESOLVE_ETAG_PARAM = "__extmod_etag";
export const EXTMOD_RESOLVE_TTL_PARAM = "__extmod_ttl";
export const EXTMOD_RESOLVE_ERROR_PARAM = "__extmod_error";

export const time: <T>(
  fn: () => T | Promise<T>
) => Promise<[number, T]> = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now() - start;

  return [end, result];
};

export const extmodUrl = (url: URL) => {
  const error = url.searchParams.get(EXTMOD_RESOLVE_ERROR_PARAM);
  url.searchParams.delete(EXTMOD_RESOLVE_ERROR_PARAM);

  const etag = url.searchParams.get(EXTMOD_RESOLVE_ETAG_PARAM);
  url.searchParams.delete(EXTMOD_RESOLVE_ETAG_PARAM);

  const ttl = url.searchParams.get(EXTMOD_RESOLVE_TTL_PARAM);
  url.searchParams.delete(EXTMOD_RESOLVE_TTL_PARAM);

  return {
    error,
    etag,
    ttl,
    url,
  };
};
