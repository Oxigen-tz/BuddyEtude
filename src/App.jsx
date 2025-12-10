import React from "react";
// 🟢 CONSERVATION des imports nécessaires (Routes, Route, Navigate, etc.)
import { Routes, Route, Navigate } from "react-router-dom"; 
import { useAuth } from "./context/AuthContext"; // 🟢 Conservation de useAuth

// Composants de structure
import Header from "./components/Header";
import Footer from "./components/Footer";
import CallNotifier from "./components/CallNotifier"; 

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import FindBuddy from "./pages/FindBuddy";
import Login from "./pages/Login";
import VideoCall from "./pages/VideoCall";

// =======================================================================
// COMPOSANT DE PROTECTION DE ROUTE (PrivateRoute) - Définition conservée ici
// =======================================================================
const PrivateRoute = ({ element: Element }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="text-center p-20">Vérification de la session...</div>;
  }
  
  return user ? <Element /> : <Navigate to="/login" replace />;
};

// =======================================================================
// COMPOSANT PRINCIPAL
// =======================================================================
const App = () => {
  // Nécessaire pour conditionner l'affichage (ex: CallNotifier)
  const { user, loading } = useAuth(); 

  // Optionnel : Afficher un chargement initial si l'auth est lent
  if (loading) {
     return <div className="flex justify-center items-center min-h-screen">Chargement de l'application...</div>;
  }

  return (
    // ❌ SUPPRIMER <AuthProvider> et <Router> ici
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* 🔔 Affichage du Notifier UNIQUEMENT si l'utilisateur est connecté */}
      {user && <CallNotifier />} 
      
      <main className="flex-grow"> 
        <Routes>
          {/* -------------------- Routes publiques -------------------- */}
          <Route path="/" element={<Home />} />
          <Route path="/findbuddy" element={<FindBuddy />} />
          <Route path="/login" element={<Login />} />
          
          {/* -------------------- Routes protégées -------------------- */}
          <Route path="/dashboard" element={<PrivateRoute element={Dashboard} />} />
          <Route path="/profile" element={<PrivateRoute element={Profile} />} />
          <Route path="/call/:callId" element={<PrivateRoute element={VideoCall} />} /> 
          <Route path="/chat/:groupId" element={<PrivateRoute element={Chat} />} />

          {/* -------------------- Route de repli -------------------- */}
          <Route path="*" element={<div className="text-center p-20 text-xl font-semibold text-red-500">Erreur 404 - Page introuvable</div>} />

        </Routes>
      </main>
      <Footer />
    </div>
    // ❌ FIN
  );
};

export default App;