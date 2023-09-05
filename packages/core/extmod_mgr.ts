export const EXTMOD_EVENT_TYPE = "EXTMOD_EVENT";

class ExtmodEvent extends Event {
  constructor(public id: string, public mod: any) {
    super(EXTMOD_EVENT_TYPE);
  }
}

class ExtmodManager extends EventTarget {
  #mods: Record<string, any> = {};
  constructor() {
    super();
  }

  setMod(id: string, mod: any) {
    this.#mods[id] = mod;
    this.dispatchEvent(new ExtmodEvent(id, mod));
  }

  getMod(id: string) {
    return this.#mods[id];
  }
}

(window as any).extmod ??= new Proxy(new ExtmodManager(), {
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
    return Reflect.get(...args);
  },
});
