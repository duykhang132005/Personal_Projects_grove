import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * While a dialog is mounted: move focus inside, trap Tab, close on Escape,
 * and restore focus to whichever control was active when it opened.
 */
export function useDialogFocus(
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = containerRef.current;
    if (!dialog) return;

    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusables = (): HTMLElement[] =>
      [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => {
        if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') {
          return false;
        }
        return (
          el.tabIndex >= 0 &&
          !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
        );
      });

    focusables()[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = focusables();
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const start = nodes[0];
      const end = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === start || !dialog.contains(active)) {
          e.preventDefault();
          end.focus();
        }
      } else if (active === end || !dialog.contains(active)) {
        e.preventDefault();
        start.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previous?.focus();
    };
  }, [containerRef]);
}