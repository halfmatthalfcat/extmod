export default async function Home() {
  // We need to wrap our import in an eval to avoid mangling/transforming from Webpack
  const Component = await eval(`import("http://localhost:3333/react.js")`).then(m => m.default);
  console.log(Component);

  return <div>Hello World</div>;
}
