"use client";

import confetti from "https://esm.sh/canvas-confetti@1.6.0" assert { type: "client" };
import { useEffect } from "react";

export default () => {
  useEffect(() => {
    confetti();
  }, []);

  return <div>Hello World</div>;
};
