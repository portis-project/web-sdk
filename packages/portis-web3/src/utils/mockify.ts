export const mockify = <T extends {}>(obj: T): T =>
  new Proxy(obj, {
    get: (target, prop) => {
      if (target[prop] instanceof Function) {
        return () => {};
      } else {
        return undefined;
      }
    },
  }) as T;
