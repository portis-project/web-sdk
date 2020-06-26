let loaded = false;

export function onWindowLoad() {
  return new Promise(resolve => {
    if (loaded) {
      resolve();
    } else if (['loaded', 'interactive', 'complete'].indexOf(document.readyState) > -1) {
      loaded = true;
      resolve();
    } else {
      window.addEventListener(
        'load',
        () => {
          loaded = true;
          resolve();
        },
        false,
      );
    }
  });
}
