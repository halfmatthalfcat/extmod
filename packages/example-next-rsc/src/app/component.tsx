"use client";

import { useEffect, useState } from "react"

export default () => {
  const [code, setCode] = useState<number | null>(null);
  useEffect(() => {
    setCode(123);
  }, []);

  return (
    <>
      <div>cilent { code }</div>
    </>
  );
};
