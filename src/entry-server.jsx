import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import { parseRoute } from './lib/routes.js';

export function renderPage(pathname) {
  return renderToString(<App initialRoute={parseRoute(pathname)}/>);
}
