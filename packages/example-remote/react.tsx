import confetti from "https://esm.sh/canvas-confetti@1.6.0";
import { suspense } from "next/dist/shared/lib/lazy-dynamic/dynamic-no-ssr";
import { lazy, useEffect } from "react";

console.log("outside");

export default () => {
  if (typeof window === "undefined") {
    suspense();
  }
  return lazy(() => {
    useEffect(() => {
      confetti();
    }, []);

    // useEffect(() => console.log("inside"), []);

    return <div>Hello World</div>;
  });
};
