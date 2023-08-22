export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function Home() {
  // We need to wrap our import in an eval to avoid mangling/transforming from Webpack
  // @ts-ignore
  const Component = await eval(`import("http://localhost:3333/react.mjs")`);

  console.log(Component.default.toString());

  return <Component.default />;
}
