"use client";

export const EXTMOD_EVENT_TYPE = "EXTMOD_EVENT";

export class ExtmodEvent extends Event {
  constructor(public id: string, public mod: any) {
    super(EXTMOD_EVENT_TYPE);
  }
}

class ExtmodManager extends EventTarget {
  [mod: string]: any;

  #mods: Record<string, any> = {};
  constructor(initial?: Record<string, any>) {
    super();
    if (typeof initial === "object" && Object.keys(initial)) {
      Object.entries(initial).forEach(([k, v]) => this.setMod(k, v));
    }
  }

  setMod(id: string, mod: any) {
    console.log(id);
    this.#mods[id] = mod;
    this.dispatchEvent(new ExtmodEvent(id, mod));
  }

  getMod(id: string) {
    return this.#mods[id];
  }
}

let mgr: ExtmodManager;

if (
  typeof window !== "undefined" &&
  (window as any).extmod instanceof ExtmodManager
) {
  mgr = (window as any).extmod;
} else if (typeof window !== "undefined") {
  mgr = new Proxy(new ExtmodManager((window as any).extmod ?? {}), {
    set: (...args) => {
      const [target, prop, value] = args;
      if (typeof prop === "string") {
        target.setMod(prop, value);
      }
      return true;
    },
    get: (...args) => {
      const [target, prop] = args;
      if (
        typeof prop === "string" &&
        !["addEventListener", "removeEventListener"].includes(prop)
      ) {
        return target.getMod(prop);
      }
      const value = Reflect.get(...args);
      if (typeof value === "function") {
        return value.bind(target);
      } else {
        return value;
      }
    },
  });
  (window as any).extmod = mgr;
}

export default mgr;
