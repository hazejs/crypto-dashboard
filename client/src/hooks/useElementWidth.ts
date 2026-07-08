import { useLayoutEffect, useState, type RefObject } from 'react';

const DEFAULT_WIDTH = 560;

// Tracks an element's rendered width so SVG charts can draw in a 1:1 pixel
// coordinate system (full container width, no scaling distortion).
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
