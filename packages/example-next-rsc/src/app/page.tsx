import { extmod } from "extmod";
import { ExtmodSuspense } from "extmod/client";

export default async function Home() {
  // @ts-ignore
  const { default: Component } = await extmod(
    "http://localhost:3333/react.mjs",
    "client"
  );

  return (
    <>
      <div>Server Component</div>
      <ExtmodSuspense
        component={<Component />}
        fallback={<div>Hello World</div>}
      />
    </>
  );
}
