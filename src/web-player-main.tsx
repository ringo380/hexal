// Web Player entry point — browser-only, no Electron dependencies
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ViewModeProvider } from './stores/ViewModeContext';
import WebPlayerApp from './components/player/WebPlayerApp';
import './styles/player.css';
import './styles/web-player.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ViewModeProvider mode="player">
      <WebPlayerApp />
    </ViewModeProvider>
  </React.StrictMode>
);
