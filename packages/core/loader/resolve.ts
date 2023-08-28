import { ExtmodErrorCodes, ExtmodInternalError } from "@/util/error";
import TTLCache from "@isaacs/ttlcache";
import ccp from "cache-control-parser";
import { resolve as imr } from "import-meta-resolve";
import { join } from "node:path";
import config from "./config";
import logger from "./log";
import { ExtmodUrl } from "./url";
import { time } from "./util";
const { parse: ccParse } = ccp;

const etagCacheMap = new Map<string, string>();
const ttlCacheMap = new TTLCache<string, number>();
const lastTtlCacheMap = new Map<string, number>();

const resolveWith = (
  url: string,
  {
    importAssertions,
    shortCircuit,
  }: { importAssertions?: object; shortCircuit?: boolean }
) => ({
  url,
  shortCircuit: shortCircuit ?? true,
  importAssertions: importAssertions ?? {},
});

const resolve = async (
  specifier: string,
  context: { parentURL?: string; importAssertions?: { type: string } },
  next: (specifier: string, context: object) => Promise<object>
): Promise<object> => {
  logger.debug(`Resolving ${specifier}`, { fn: "resolver" });
  const parentURL = context.parentURL ? new ExtmodUrl(context.parentURL) : null;

  if (/^http?/.test(specifier)) {
    const url = new ExtmodUrl(specifier);

    if (context.importAssertions?.type === "client") {
      url.setClient(true);
    }

    const existingTtl = ttlCacheMap.get(specifier);
    const existingEtag = etagCacheMap.get(specifier);
    const lastTtl = lastTtlCacheMap.get(specifier);

    let errorCode: keyof typeof ExtmodErrorCodes;

    try {
      if (existingTtl != null) {
        logger.debug(
          `Ttl unexpired for ${specifier} (${ttlCacheMap.getRemainingTTL(
            specifier
          )}ms left)`,
          { fn: "resolver" }
        );
        url.setTtl(existingTtl.toString());
        return resolveWith(url.href, context);
      }

      logger.debug(`Fetching headers for ${specifier}`, {
        fn: "resolver",
      });
      const [ms, response] = await time(() =>
        fetch(specifier, {
          signal: AbortSignal.timeout(config.EXTMOD_RESOLVER_TIMEOUT_MS),
          method: "HEAD",
        })
      );
      logger.debug(`Fetched headers for ${specifier} (${+ms.toFixed(2)}ms)`, {
        fn: "resolver",
      });

      if (response.ok && response.headers.has("etag")) {
        const etag = response.headers.get("etag")!;

        if (existingEtag && existingEtag !== etag) {
          logger.info(
            `Etag changed for ${specifier}: ${existingEtag} -> ${etag}`,
            { fn: "resolver" }
          );
          etagCacheMap.set(specifier, etag);
        } else if (existingEtag) {
          logger.debug(`Etag cache hit for ${specifier}: ${existingEtag}`, {
            fn: "resolver",
          });
        } else {
          logger.info(`Etag first seen for ${specifier}: ${etag}`, {
            fn: "resolver",
          });
          etagCacheMap.set(specifier, etag);
        }

        url.setEtag(etag);
        return resolveWith(url.href, context);
      } else if (response.ok && response.headers.has("Cache-Control")) {
        const cc = response.headers.get("Cache-Control")!;
        const { "max-age": maxAge } = ccParse(cc);

        if (maxAge != null && maxAge !== 0) {
          logger.info(`Ttl (max-age) of ${maxAge} found for ${specifier}`, {
            fn: "resolver",
          });
          const insertionTime = Date.now();
          ttlCacheMap.set(specifier, insertionTime, { ttl: maxAge * 1000 });
          lastTtlCacheMap.set(specifier, insertionTime);
          url.setTtl(insertionTime.toString());
          return resolveWith(url.href, context);
        }
      } else if (response.ok) {
        logger.warn(
          `Resolved ${specifier} but found no etag or max-age. Resource will not receive updates.`,
          {
            fn: "resolver",
          }
        );
        return resolveWith(url.href, context);
      }

      errorCode = `L${response.status}` as keyof typeof ExtmodErrorCodes;
    } catch (ex) {
      if (ex instanceof Error && ex.name === "AbortError") {
        logger.error(
          `Timed out (${config.EXTMOD_RESOLVER_TIMEOUT_MS}ms) getting headers for ${specifier}`,
          {
            fn: "resolver",
          }
        );
        errorCode = ExtmodInternalError.RESOLVER_FETCH_TIMEOUT;
      } else if (
        ex instanceof Error &&
        ["TypeError", "SystemError"].includes(ex.name)
      ) {
        logger.error(
          `Caught fetch error resolving ${specifier}: ${
            (ex as unknown as any).code ??
            (ex as unknown as any).cause?.code ??
            ex.message
          }`,
          {
            fn: "resolver",
          }
        );
        errorCode = ExtmodInternalError.RESOLVER_FETCH_ERROR;
      } else {
        logger.error(`Caught unexpected error resolving ${specifier}`, {
          fn: "resolver",
        });
      }

      errorCode ??= ExtmodInternalError.UNEXPECTED_ERROR;
    }

    if (existingEtag) {
      logger.warn(
        `Resolve failed with ${errorCode} but found cached etag ${existingEtag} for ${specifier}`,
        { fn: "resolver" }
      );
      url.setEtag(existingEtag);
    } else if (lastTtl != null) {
      logger.warn(
        `Resolve failed with ${errorCode} but found cached ttl ${lastTtl} (insertion time) for ${specifier}`,
        { fn: "resolver" }
      );
      url.setTtl(lastTtl.toString());
    } else if (errorCode != null) {
      logger.error(
        `Resolve failed with ${errorCode} without a cache entry for ${specifier}`,
        { fn: "resolver" }
      );
      url.setError(errorCode);
    } else {
      logger.error(
        `Resolve failed due to unmet cache criteria for ${specifier}`,
        { fn: "resolver" }
      );
      url.setError(ExtmodInternalError.RESOLVER_CRITERIA_UNMET);
    }

    return resolveWith(url.href, context);
  } else if (
    parentURL?.protocol.startsWith("http") &&
    specifier.startsWith("/")
  ) {
    logger.debug(
      `Got relative specifier ${specifier} for remote ${parentURL.toOG().href}`,
      {
        fn: "resolver",
      }
    );
    return resolveWith(join(parentURL.origin, specifier), {
      ...context,
      importAssertions: parentURL.hasClient()
        ? {
            type: "client",
          }
        : {},
    });
  } else if (!/.+:/.test(specifier)) {
    logger.debug(`Got bare specifier ${specifier}, trying to resolve locally`, {
      fn: "resolver",
    });

    try {
      // @ts-ignore
      const modulePath = imr(specifier, import.meta.url);

      logger.debug(`Found local path for bare ${specifier} at ${modulePath}`, {
        fn: "resolver",
      });

      if (modulePath) {
        return resolveWith(modulePath, context);
      }
    } catch {}
  }

  logger.debug(`Continuing resolve chain for ${specifier}`, {
    fn: "resolver",
  });

  return next(specifier, context);
};

export default async <P extends Parameters<typeof resolve>>(
  ...params: P
): ReturnType<typeof resolve> => {
  const [specifier, ...rest] = params;
  const [ms, result] = await time(() => resolve(specifier, ...rest));
  logger.debug(`Resolving ${specifier} took ${ms.toFixed(2)}ms`, {
    fn: "resolver",
  });
  return result;
};
