"use client";

import { useEffect, useState } from "react"

export default () => {
  const [code, setCode] = useState<number | null>(null);
  useEffect(() => {
    fetch('https://halfmatthalfcat.com', { method: "HEAD" }).then(r => setCode(r.status));
  }, []);

  return (
    <>
      <div>cilent { code }</div>
    </>
  );
};
