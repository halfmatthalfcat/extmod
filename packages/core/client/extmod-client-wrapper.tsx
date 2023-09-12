"use client";

import "./extmod-client-mgr";

import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export const ExtmodClientWrapper: FC<PropsWithChildren> = ({
  children: _children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [children, setChildren] = useState(_children ?? []);

  const observe = useCallback<MutationCallback>((mutations) => {
    const [script] = mutations
      .flatMap((mutation) => [...mutation.addedNodes])
      .filter(
        (node): node is HTMLScriptElement =>
          node.nodeName.toLowerCase() === "script"
      )
      .filter((script) => script.hasAttribute("data-id"));

    if (script) {
      script.addEventListener("load", () => {
        if ((window as any).extmod) {
          const Component = (window as any).extmod[
            script.getAttribute("data-id")!
          ].default;
          setChildren([<Component />]);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (ref.current) {
      const observer = new MutationObserver(observe);
      observer.observe(ref.current, {
        subtree: true,
        childList: true,
      });

      return () => {
        observer.disconnect();
      };
    }
  }, [ref, observe]);

  return <div ref={ref}>{children}</div>;
};
