// import confetti from "https://esm.sh/canvas-confetti@1.6.0";
import { useEffect } from "react";

console.log("outside");

export default () => {
  // useEffect(() => {
  //   confetti();
  // }, []);

  useEffect(() => console.log("inside"), []);

  return <div>Hello World</div>;
};
