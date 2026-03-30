// React entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CampaignProvider } from './stores/CampaignContext';
import { SelectionProvider } from './stores/SelectionContext';
import { ViewModeProvider } from './stores/ViewModeContext';
import type { ViewMode } from './stores/ViewModeContext';
import PlayerApp from './components/player/PlayerApp';
import { SettingsProvider } from './stores/SettingsContext';
import { AuthProvider } from './stores/AuthContext';
import { AnnouncerProvider } from './stores/AnnouncerContext';
import { ToastProvider } from './stores/ToastContext';
import { createPersistenceAdapter } from './services/persistence';
import { SyncProvider } from './stores/SyncContext';
import { ClerkProvider } from '@clerk/react';
import './styles/app.css';
import './styles/auth.css';
import './styles/weather.css';

const isPlayerView = window.location.hash === '#player-view';
const viewMode: ViewMode = isPlayerView ? 'player' : 'dm';
const persistenceAdapter = createPersistenceAdapter('local');

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ViewModeProvider mode={viewMode}>
      {isPlayerView ? (
        <PlayerApp />
      ) : CLERK_PUBLISHABLE_KEY ? (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
          <SettingsProvider>
            <AuthProvider clerkEnabled>
              <SyncProvider engine={null}>
                <CampaignProvider adapter={persistenceAdapter}>
                  <SelectionProvider>
                    <AnnouncerProvider>
                      <ToastProvider>
                        <App />
                      </ToastProvider>
                    </AnnouncerProvider>
                  </SelectionProvider>
                </CampaignProvider>
              </SyncProvider>
            </AuthProvider>
          </SettingsProvider>
        </ClerkProvider>
      ) : (
        <SettingsProvider>
          <AuthProvider>
            <SyncProvider engine={null}>
              <CampaignProvider adapter={persistenceAdapter}>
                <SelectionProvider>
                  <AnnouncerProvider>
                    <ToastProvider>
                      <App />
                    </ToastProvider>
                  </AnnouncerProvider>
                </SelectionProvider>
              </CampaignProvider>
            </SyncProvider>
          </AuthProvider>
        </SettingsProvider>
      )}
    </ViewModeProvider>
  </React.StrictMode>
);
