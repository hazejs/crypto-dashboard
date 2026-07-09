import { useEffect, useState, type ReactNode, type TransitionEvent } from 'react';

export interface DetailDrawerProps {
  open: boolean;
  colSpan: number;
  children: ReactNode;
}

export function DetailDrawer({ open, colSpan, children }: DetailDrawerProps) {
  const [mounted, setMounted] = useState(open);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) {
      setExpanded(false);
      return;
    }
    setMounted(true);
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
