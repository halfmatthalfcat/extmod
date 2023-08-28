import { extmodEval } from "@extmod/core";

export default async function Home() {
  // We need to wrap our import in an eval to avoid mangling/transforming from Webpack
  // @ts-ignore
  const Component = await extmodEval("http://localhost:3333/react.mjs");

  console.log(Component);

  return <Component.default />;
}
