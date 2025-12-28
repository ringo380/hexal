// React entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CampaignProvider } from './stores/CampaignContext';
import { SelectionProvider } from './stores/SelectionContext';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CampaignProvider>
      <SelectionProvider>
        <App />
      </SelectionProvider>
    </CampaignProvider>
  </React.StrictMode>
);
