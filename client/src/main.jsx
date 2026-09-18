import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import CSS Design System
import 'mapbox-gl/dist/mapbox-gl.css';
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/map.css';
import './styles/admin.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
