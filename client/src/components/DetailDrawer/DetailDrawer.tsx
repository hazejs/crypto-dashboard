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
    // Expand on the next frame so the browser transitions from the 0fr start state.
    const frame = requestAnimationFrame(() => setExpanded(true));
    return () => cancelAnimationFrame(frame);
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
