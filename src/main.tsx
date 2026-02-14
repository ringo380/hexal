// React entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CampaignProvider } from './stores/CampaignContext';
import { SelectionProvider } from './stores/SelectionContext';
import { ViewModeProvider } from './stores/ViewModeContext';
import type { ViewMode } from './stores/ViewModeContext';
import PlayerApp from './components/player/PlayerApp';
import './styles/app.css';

const isPlayerView = window.location.hash === '#player-view';
const viewMode: ViewMode = isPlayerView ? 'player' : 'dm';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ViewModeProvider mode={viewMode}>
      {isPlayerView ? (
        <PlayerApp />
      ) : (
        <CampaignProvider>
          <SelectionProvider>
            <App />
          </SelectionProvider>
        </CampaignProvider>
      )}
    </ViewModeProvider>
  </React.StrictMode>
);
