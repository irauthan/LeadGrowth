import { useEffect, type RefObject } from 'react';

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent | KeyboardEvent) => void,
  listenEscape = true
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    const keyListener = (event: KeyboardEvent) => {
      if (listenEscape && event.key === 'Escape') {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    if (listenEscape) {
      document.addEventListener('keydown', keyListener);
    }

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
      if (listenEscape) {
        document.removeEventListener('keydown', keyListener);
      }
    };
  }, [ref, handler, listenEscape]);
}
