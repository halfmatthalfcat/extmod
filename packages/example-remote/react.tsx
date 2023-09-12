import confetti from "https://esm.sh/canvas-confetti@1.6.0";
import { useEffect } from "react";

export default () => {
  useEffect(() => {
    confetti();
  }, []);

  return <div>Remote Control - LOL</div>;
};
