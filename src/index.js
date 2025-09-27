import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create root for React 18+
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the main application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: Log web vitals or send to analytics endpoint
// To log to the console: reportWebVitals(console.log);
// To send to analytics service: reportWebVitals((metric) => { ... });
reportWebVitals();
