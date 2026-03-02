// SelectionContext - Backward-compatible shim composing the 4 split contexts
// Consumers should migrate to useHexSelection, useFilter, useLayerVisibility, useCommandPalette

import React from 'react';
import { HexSelectionProvider, useHexSelection } from './HexSelectionContext';
import { FilterProvider, useFilter } from './FilterContext';
import { LayerVisibilityProvider, useLayerVisibility } from './LayerVisibilityContext';
import { CommandPaletteProvider, useCommandPalette } from './CommandPaletteContext';

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteProvider>
      <LayerVisibilityProvider>
        <FilterProvider>
          <HexSelectionProvider>
            {children}
          </HexSelectionProvider>
        </FilterProvider>
      </LayerVisibilityProvider>
    </CommandPaletteProvider>
  );
}

/** @deprecated Migrate to useHexSelection, useFilter, useLayerVisibility, or useCommandPalette */
export function useSelection() {
  const hexSelection = useHexSelection();
  const filter = useFilter();
  const layers = useLayerVisibility();
  const commandPalette = useCommandPalette();

  return {
    ...hexSelection,
    ...filter,
    ...layers,
    ...commandPalette,
  };
}
