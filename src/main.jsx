import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '@fontsource/source-sans-3/latin-400.css';
import '@fontsource/source-sans-3/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import App from './App.jsx';
import './styles.css';
import { legacyDestination } from './lib/routes.js';

const legacyUrl = legacyDestination(location.hash);
if (legacyUrl) {
  location.replace(legacyUrl);
} else {
  const root = document.getElementById('root');
  const app = <React.StrictMode><App /></React.StrictMode>;
  if (root.childElementCount) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
