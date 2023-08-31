import { extmodEval } from "@extmod/core";
import { Suspense } from "react";

// export const dynamic = 'force-dynamic';

export default async function Home() {
  // We need to wrap our import in an eval to avoid mangling/transforming from Webpack
  // @ts-ignore
  // const Component = await ;

  // console.log(Component);

  const { default: Component } = await extmodEval("http://localhost:3333/react.mjs", "client");

  return (
    <>
      <div>Server Component</div>
      <Suspense>
        <Component />
      </Suspense>
    </>
  );
}
