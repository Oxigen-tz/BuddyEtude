import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';

// Point d'entrée principal de l'application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter gère les URL et la navigation */}
    {/* Les flags 'future' suppriment les avertissements de la console */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      
      {/* AuthProvider rend l'utilisateur (user) accessible partout */}
      <AuthProvider>
        <App />
      </AuthProvider>

    </BrowserRouter>
  </React.StrictMode>,
);