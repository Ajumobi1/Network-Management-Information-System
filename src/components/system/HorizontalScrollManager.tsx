import { useEffect } from 'react';

const SELECTOR = '[data-horizontal-scroll],.nmis-table-scroll,.nmis-tab-scroll,.overflow-x-auto,.overflow-x-scroll';

function isEditable(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;
  return !!element && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName));
}

function findScroller(target: EventTarget | null): HTMLElement | null {
  let element = target instanceof HTMLElement ? target : null;
  while (element && element !== document.body) {
    if (
      !element.hasAttribute('data-horizontal-scroll-proxy') &&
      element.scrollWidth > element.clientWidth + 1 &&
      ['auto', 'scroll', 'overlay'].includes(getComputedStyle(element).overflowX)
    ) return element;
    element = element.parentElement;
  }
  return null;
}

export default function HorizontalScrollManager() {
  useEffect(() => {
    let active: HTMLElement | null = null;
    let bar: HTMLDivElement | null = null;
    let track: HTMLDivElement | null = null;
    let frame = 0;

    const ensureBar = () => {
      if (bar) return;
      bar = document.createElement('div');
      bar.className = 'nmis-horizontal-scrollbar';
      bar.dataset.horizontalScrollProxy = 'true';
      bar.setAttribute('role', 'scrollbar');
      bar.setAttribute('aria-label', 'Horizontal content navigation');
      bar.setAttribute('aria-orientation', 'horizontal');

      track = document.createElement('div');
      track.className = 'nmis-horizontal-scrollbar__track';
      bar.appendChild(track);
      document.body.appendChild(bar);

      bar.addEventListener('scroll', () => {
        if (active) active.scrollLeft = bar!.scrollLeft;
      }, { passive: true });
    };

    const update = () => {
      if (!active || active.scrollWidth <= active.clientWidth + 1) {
        bar?.classList.remove('is-visible');
        return;
      }

      ensureBar();
      const width = Math.max(160, active.clientWidth);
      const ratio = active.clientWidth / active.scrollWidth;

      track!.style.width = `${active.scrollWidth}px`;
      bar!.scrollLeft = active.scrollLeft;
      bar!.classList.add('is-visible');
      bar!.setAttribute('aria-valuemin', '0');
      bar!.setAttribute('aria-valuemax', String(Math.max(0, active.scrollWidth - active.clientWidth)));
      bar!.setAttribute('aria-valuenow', String(Math.round(active.scrollLeft)));
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    const onPointerOver = (event: PointerEvent) => {
      const scroller = findScroller(event.target);
      if (scroller) {
        active = scroller;
        schedule();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      const scroller = findScroller(event.target);
      if (scroller) {
        active = scroller;
        schedule();
      }
    };

    const onScroll = (event: Event) => {
      if (event.target === active) schedule();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isEditable(event.target)) return;

      const scroller = findScroller(event.target) || active;
      if (!scroller) return;

      let delta = 0;
      switch (event.key) {
        case 'PageLeft':
        case 'PageUp':
          delta = -scroller.clientWidth * 0.9;
          break;
        case 'PageRight':
        case 'PageDown':
          delta = scroller.clientWidth * 0.9;
          break;
        case 'ArrowLeft':
          delta = -Math.max(80, scroller.clientWidth * 0.12);
          break;
        case 'ArrowRight':
          delta = Math.max(80, scroller.clientWidth * 0.12);
          break;
        default:
          return;
      }

      event.preventDefault();
      active = scroller;
      scroller.scrollBy({ left: delta, behavior: 'smooth' });
      schedule();
    };

    const resizeObserver = new ResizeObserver(schedule);
    const mutationObserver = new MutationObserver(() => {
      document.querySelectorAll(SELECTOR).forEach(element => {
        if (element instanceof HTMLElement) resizeObserver.observe(element);
      });
      schedule();
    });

    document.querySelectorAll(SELECTOR).forEach(element => {
      if (element instanceof HTMLElement) resizeObserver.observe(element);
    });

    document.addEventListener('pointerover', onPointerOver, true);
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('scroll', onScroll, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', schedule);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener('pointerover', onPointerOver, true);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', schedule);
      bar?.remove();
    };
  }, []);

  return null;
}
