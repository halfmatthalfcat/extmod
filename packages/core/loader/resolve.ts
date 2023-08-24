import { ExtModErrorCodes } from "@/.";
import TTLCache from "@isaacs/ttlcache";
import ccp from "cache-control-parser";
import { resolve as imr } from "import-meta-resolve";
import config from "./config";
import logger from "./log";
import {
  EXTMOD_RESOLVE_ERROR_PARAM,
  EXTMOD_RESOLVE_ETAG_PARAM,
  EXTMOD_RESOLVE_TTL_PARAM,
  time,
} from "./util";
const { parse: ccParse } = ccp;

const etagCacheMap = new Map<string, string>();
const ttlCacheMap = new TTLCache<string, number>();
const lastTtlCacheMap = new Map<string, number>();

export async function resolve(
  specifier: string,
  context: any,
  next: (specifier: string, context: any) => void
) {
  logger.debug(`Resolving ${specifier}`, { fn: "resolver" });

  if (/^http?/.test(specifier)) {
    const url = new URL(specifier);

    const existingTtl = ttlCacheMap.get(specifier);
    const existingEtag = etagCacheMap.get(specifier);
    const lastTtl = lastTtlCacheMap.get(specifier);

    let errorCode;

    try {
      if (existingTtl != null) {
        logger.debug(
          `Ttl unexpired for ${specifier} (${ttlCacheMap.getRemainingTTL(
            specifier
          )}ms left)`,
          { fn: "resolver" }
        );
        url.searchParams.set(EXTMOD_RESOLVE_TTL_PARAM, existingTtl.toString());
        return {
          url: url.href,
          shortCircuit: true,
        };
      }

      logger.debug(`Fetching headers for ${specifier}`, { fn: "resolver" });
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

        url.searchParams.set(EXTMOD_RESOLVE_ETAG_PARAM, etag);
        return {
          url: url.href,
          shortCircuit: true,
        };
      } else if (response.ok && response.headers.has("cache-control")) {
        const cc = response.headers.get("cache-control")!;
        const { "max-age": maxAge } = ccParse(cc);

        if (maxAge != null && maxAge !== 0) {
          logger.info(`Ttl (max-age) of ${maxAge} found for ${specifier}`, {
            fn: "resolver",
          });
          const insertionTime = Date.now();
          ttlCacheMap.set(specifier, insertionTime, { ttl: maxAge * 1000 });
          lastTtlCacheMap.set(specifier, insertionTime);
          url.searchParams.set(
            EXTMOD_RESOLVE_TTL_PARAM,
            insertionTime.toString()
          );
          return {
            url: url.href,
            shortCircuit: true,
          };
        }
      } else {
        errorCode = response.status;
      }
    } catch (ex) {
      if (ex instanceof Error && ex.name === "AbortError") {
        logger.error(
          `Timed out (${config.EXTMOD_RESOLVER_TIMEOUT_MS}ms) getting headers for ${specifier}`,
          {
            fn: "resolver",
          }
        );
        errorCode = ExtModErrorCodes.RESOLVER_TIMEOUT;
      } else if (ex instanceof Error) {
        logger.error(
          `Caught unexpected error resolving ${specifier}: ${ex.message}`,
          {
            fn: "resolver",
          }
        );
      } else {
        logger.error(`Caught unexpected error resolving ${specifier}`, {
          fn: "resolver",
        });
      }

      errorCode ??= ExtModErrorCodes.UNEXPECTED_ERROR;
    }

    if (existingEtag) {
      logger.warn(
        `Resolve failed with ${errorCode} but found cached etag ${existingEtag} for ${specifier}`,
        { fn: "resolver" }
      );
      url.searchParams.set(EXTMOD_RESOLVE_ETAG_PARAM, existingEtag);
    } else if (lastTtl != null) {
      logger.warn(
        `Resolve failed with ${errorCode} but found cached ttl ${lastTtl} (insertion time) for ${specifier}`,
        { fn: "resolver" }
      );
      url.searchParams.set(EXTMOD_RESOLVE_TTL_PARAM, lastTtl.toString());
    } else if (errorCode != null) {
      logger.error(
        `Resolve failed with ${errorCode} without a cache entry for ${specifier}`,
        { fn: "resolver" }
      );
      url.searchParams.set(EXTMOD_RESOLVE_ERROR_PARAM, errorCode.toString());
    } else {
      logger.error(
        `Resolve failed due to unmet cache criteria for ${specifier}`,
        { fn: "resolver" }
      );
      url.searchParams.set(
        EXTMOD_RESOLVE_ERROR_PARAM,
        ExtModErrorCodes.RESOLVER_CRITERIA_UNMET.toString()
      );
    }

    return {
      url: url.href,
      shortCircuit: true,
    };
    // If this is a bare module specifier, try to resolve the full path
  } else if (!/.+:/.test(specifier)) {
    try {
      // @ts-ignore
      const modulePath = imr(specifier, import.meta.url);

      if (modulePath) {
        // @ts-ignore
        return {
          url: modulePath,
          shortCircuit: true,
        };
      }
    } catch {}
  }

  return next(specifier, context);
}
