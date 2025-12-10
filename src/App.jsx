import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Composants de structure
import Header from "./components/Header";
import Footer from "./components/Footer";
import CallNotifier from "./components/CallNotifier"; // <-- Composant de notification

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import FindBuddy from "./pages/FindBuddy";
import Login from "./pages/Login";
import VideoCall from "./pages/VideoCall"; // <-- Page de visio

// =======================================================================
// COMPOSANT DE PROTECTION DE ROUTE (PrivateRoute)
// =======================================================================
/**
 * Empêche les utilisateurs non connectés d'accéder aux pages protégées.
 * Affiche un écran de chargement si l'état d'authentification est encore inconnu.
 */
const PrivateRoute = ({ element: Element }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    // Écran d'attente pendant la vérification de l'état Firebase
    return <div className="text-center p-20">Vérification de la session...</div>;
  }
  
  // Si l'utilisateur est connecté, affiche le composant. Sinon, redirige vers /login.
  return user ? <Element /> : <Navigate to="/login" replace />;
};

// =======================================================================
// COMPOSANT PRINCIPAL
// =======================================================================
const App = () => {
  return (
    // Fournit le contexte d'authentification à toute l'application
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
            <Header />
            
            {/* 🔔 Le CallNotifier est placé ici pour être visible sur TOUTES les pages 
                et au-dessus du contenu principal (main) */}
            <CallNotifier /> 
            
            <main className="flex-grow"> 
                <Routes>
                    {/* -------------------- Routes publiques -------------------- */}
                    <Route path="/" element={<Home />} />
                    <Route path="/findbuddy" element={<FindBuddy />} />
                    <Route path="/login" element={<Login />} />
                    
                    {/* -------------------- Routes protégées -------------------- */}
                    
                    {/* Tableau de bord de l'utilisateur */}
                    <Route path="/dashboard" element={<PrivateRoute element={Dashboard} />} />
                    
                    {/* Profil et modification des préférences */}
                    <Route path="/profile" element={<PrivateRoute element={Profile} />} />
                    
                    {/* Salle d'appel vidéo (protégée pour s'assurer que l'utilisateur est connu) */}
                    <Route path="/call/:callId" element={<PrivateRoute element={VideoCall} />} /> 

                    {/* -------------------- Route de repli -------------------- */}
                    
                    {/* Route 404 (Page non trouvée) */}
                    <Route path="*" element={<div className="text-center p-20 text-xl font-semibold text-red-500">Erreur 404 - Page introuvable</div>} />

                </Routes>
            </main>
            <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;