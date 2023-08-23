export default async function Home() {
  // We need to wrap our import in an eval to avoid mangling/transforming from Webpack
  // @ts-ignore
  const Component = await eval(`import("http://localhost:3333/react.mjs")`);

  return <Component.default />;
}
