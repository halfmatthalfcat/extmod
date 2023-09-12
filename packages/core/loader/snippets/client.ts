export const clientFlowSnippet = ({
  id,
  bundlePath,
}: {
  id: string;
  bundlePath: string;
}) =>
  `import { useEffect, useState, Suspense } from "react";
  
  const port = globalThis.__extmod_port;
  const waitForBundle = new Promise((resolve, reject) => {
    if (!port) { return reject("..."); }
    port.addEventListener("message", ({ data }) =>
      data === "${id}" && resolve(void 0)
    );
  });

  const use = promise => {
    if (promise.status === 'fulfilled') {
      console.log("promise fufilled");
      return void 0;
    } else if (promise.status === 'rejected') {
      throw promise;
    } else if (promise.status === 'pending') {
      throw promise;
    } else {
      promise.status = 'pending';
      promise.then(
        result => {
          promise.status = 'fulfilled';
          promise.value = void 0;
        },
        reason => {
          promise.status = 'rejected';
          promise.reason = void 0;
        },      
      );
      throw promise;
    }
  };

  const Server = () => {
    use(waitForBundle);

    return <script data-id="${id}" src="${bundlePath}" defer />;
  };
  
  export default () => (
    <Suspense fallback={<div>Loading...</div>}>
      <Server />
    </Suspense>
  )`;
