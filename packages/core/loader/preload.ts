/// <reference types="typings-esm-loader" />

export let port: Parameters<globalPreload>[0]["port"] | undefined;

const preload: globalPreload = ({ port: preloadPort }) => {
  port = preloadPort;
  return `globalThis.__extmod_port = port`;
};

export default preload;
