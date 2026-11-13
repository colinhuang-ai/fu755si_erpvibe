import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './styles/ios.css';
import './styles/app.css';
import App from './App';
import { applyTheme, loadSettings } from './lib/settings';

applyTheme(loadSettings().theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
