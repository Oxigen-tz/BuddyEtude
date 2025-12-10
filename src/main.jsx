import React from 'react';
import ReactDOM from 'react-dom/client';
// 🟢 1. AJOUTER BrowserRouter pour le routage
import { BrowserRouter } from 'react-router-dom'; 
import App from './App.jsx';
import './index.css';

// 🟢 2. AJOUTER AuthProvider pour le contexte Firebase
import { AuthProvider } from './context/AuthContext'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🟢 ENVELOPPE 1 : Fournit les fonctionnalités de routage */}
    <BrowserRouter>
      {/* 🟢 ENVELOPPE 2 : Fournit l'état de connexion à l'ensemble de l'application */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);