"use client";

import mgr, { EXTMOD_EVENT_TYPE } from "./extmod-client-mgr";

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
          ]().default;
          setChildren([<Component />]);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (ref.current) {
      const script = ref.current.querySelector("script");
      const id = script?.getAttribute("data-id");

      if (script && id && mgr[id]) {
        console.log("preloaded");
        const Component = mgr[id]().default;

        setChildren([<Component />]);
      } else if (script && id) {
        console.log("loading");
        // @ts-ignore
        const fn = ({ target }) => {
          console.log(target);
          mgr.removeEventListener(EXTMOD_EVENT_TYPE, fn);
        };
        mgr.addEventListener(EXTMOD_EVENT_TYPE, fn);
        script.addEventListener("load", () => {
          if ((window as any).extmod) {
            const Component = (window as any).extmod[
              script.getAttribute("data-id")!
            ]().default;
            setChildren([<Component />]);
          }
        });
      } else {
        console.log("fetching");
        const observer = new MutationObserver(observe);
        observer.observe(ref.current, {
          subtree: true,
          childList: true,
        });

        return () => {
          observer.disconnect();
        };
      }
    }
  }, [ref, observe]);

  return <div ref={ref}>{children}</div>;
};
