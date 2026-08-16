import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { LiveRunProvider } from './LiveRunProvider.jsx';
import './styles.css';

// De provider staat boven de router: één verbinding met showcase-CBT voor de
// hele sessie, die niet omvalt zodra je van de plaat naar het rapport loopt.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LiveRunProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LiveRunProvider>
  </React.StrictMode>
);
