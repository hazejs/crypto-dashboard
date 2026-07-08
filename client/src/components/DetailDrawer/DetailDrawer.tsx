import { useEffect, useState, type ReactNode, type TransitionEvent } from 'react';

export interface DetailDrawerProps {
  open: boolean;
  colSpan: number;
  children: ReactNode;
}

// Table-row drawer that slides open and closed (grid-template-rows 0fr <-> 1fr).
// Content stays mounted through the exit transition, then unmounts.
export function DetailDrawer({ open, colSpan, children }: DetailDrawerProps) {
  const [mounted, setMounted] = useState(open);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) {
      setExpanded(false); // collapse; unmount happens on transitionend
      return;
    }
    setMounted(true);
    // Two frames: the first lets the browser paint the collapsed (0fr) state,
    // so the flip to 1fr runs the full transition instead of applying
    // instantly — keeping open and close at the same speed.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setExpanded(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [open]);

  function onTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (!open && e.target === e.currentTarget) setMounted(false);
  }

  if (!mounted) return null;
  return (
    <tr className="detail-row">
      <td colSpan={colSpan}>
        <div className={expanded ? 'drawer open' : 'drawer'} onTransitionEnd={onTransitionEnd}>
          <div className="drawer-inner">{children}</div>
        </div>
      </td>
    </tr>
  );
}
