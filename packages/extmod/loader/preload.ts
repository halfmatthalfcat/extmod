/**
 * globalPreload is used to expose communication between the loader and downstream
 * applications importing things. Most notibly, this is used for Client Components and
 * React Suspense to notify Suspense when we've fully bundled, and to then render appropriately.
 * */

/// <reference types="typings-esm-loader" />

export let port: Parameters<globalPreload>[0]["port"] | undefined;

const preload: globalPreload = ({ port: preloadPort }) => {
  port = preloadPort;
  return `globalThis.__extmod_port = port`;
};

export default preload;
