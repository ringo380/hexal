// ViewMode context — determines if the app is running as DM or Player view

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export type ViewMode = 'dm' | 'player';

const ViewModeContext = createContext<ViewMode>('dm');

export function ViewModeProvider({ mode, children }: { mode: ViewMode; children: ReactNode }) {
  return <ViewModeContext.Provider value={mode}>{children}</ViewModeContext.Provider>;
}

export function useViewMode(): ViewMode {
  return useContext(ViewModeContext);
}
