const createMemoryStorage = () => {
  const store = new Map();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      const value = store.get(String(key));
      return typeof value === "undefined" ? null : value;
    },
    key(index) {
      const keys = Array.from(store.keys());
      return typeof keys[index] === "undefined" ? null : keys[index];
    },
    removeItem(key) {
      store.delete(String(key));
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    }
  };
};

const ensureStorage = (name) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  const needsShim =
    !descriptor ||
    typeof descriptor.get === "function" ||
    typeof descriptor.set === "function" ||
    typeof descriptor.value === "undefined";

  if (!needsShim) {
    return;
  }

  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: createMemoryStorage()
  });
};

ensureStorage("localStorage");
ensureStorage("sessionStorage");

if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}
