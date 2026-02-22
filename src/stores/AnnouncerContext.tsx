// AnnouncerContext — Provides screen-reader announcements via aria-live regions.
// Usage: const announce = useAnnounce(); announce('5 hexes found');

import { createContext, useContext, useCallback, useRef, type ReactNode } from 'react';

type Priority = 'polite' | 'assertive';
type AnnounceFn = (message: string, priority?: Priority) => void;

const AnnouncerContext = createContext<AnnounceFn>(() => {});

export function useAnnounce(): AnnounceFn {
  return useContext(AnnouncerContext);
}

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  const announce: AnnounceFn = useCallback((message, priority = 'polite') => {
    const el = priority === 'assertive' ? assertiveRef.current : politeRef.current;
    if (!el) return;
    // Clear-then-set to force re-announcement of repeated messages
    el.textContent = '';
    setTimeout(() => {
      el.textContent = message;
    }, 50);
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div ref={politeRef} aria-live="polite" className="sr-only" role="status" />
      <div ref={assertiveRef} aria-live="assertive" className="sr-only" role="alert" />
    </AnnouncerContext.Provider>
  );
}
