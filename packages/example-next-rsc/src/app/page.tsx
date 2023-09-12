import { extmodClient } from "@extmod/core";
// import Component from "./component";

// export const dynamic = 'force-dynamic';

export default async function Home() {
  // We need to wrap our import in an eval to avoid mangling/transforming from Webpack
  // @ts-ignore
  // const Component = await ;

  // console.log(Component);

  const { default: Component } = await extmodClient({
    url: "http://localhost:3333/react.mjs",
  });

  return (
    <>
      <div>Server Component</div>
      <Component />
    </>
  );
}
