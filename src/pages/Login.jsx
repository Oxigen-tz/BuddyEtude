import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Import du contexte d'authentification centralisé
import { useAuth } from "../context/AuthContext"; 

const Login = () => {
  const { user, loginWithGoogle, loading: authLoading } = useAuth(); // Récupère l'état et la fonction du Contexte
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirection si l'utilisateur est déjà connecté
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(); // Utilise la fonction du contexte
      // La redirection vers /dashboard se fera via l'useEffect ci-dessus 
      // ou dans le contexte si vous l'implémentez là-bas.
    } catch (e) {
      // Les erreurs Firebase sont gérées ici
      setError("Erreur de connexion : " + (e.message || "Veuillez réessayer."));
      console.error("Erreur de connexion Google:", e);
      setLoading(false); // Réactive le bouton en cas d'échec
    }
    // Note: Ne pas mettre setLoading(false) dans le finally si la connexion réussit, 
    // car l'useEffect doit gérer l'état. On le met juste dans le catch ici.
  };
  
  // Afficher un état d'attente lors du chargement initial de l'auth ou de la connexion
  if (authLoading || user) return <div className="p-6 text-center">Redirection...</div>;

  return (
    <div className="text-center mt-20 p-6 max-w-md mx-auto bg-white shadow-xl rounded-xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Connexion BuddyEtude</h1>
      
      {/* Bouton de connexion */}
      <button 
        onClick={handleGoogleLogin}
        className="flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg shadow transition duration-200 disabled:opacity-50 font-semibold"
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Connexion en cours...
          </>
        ) : (
          "Se connecter avec Google"
        )}
      </button>

      {/* Message d'erreur */}
      {error && (
        <p className="text-red-500 mt-4 p-2 bg-red-50 rounded text-sm border border-red-200">
          {error}
        </p>
      )}
      
      <p className="text-sm text-gray-500 mt-6">
          La connexion via Google nous permet de valider votre statut d'étudiant.
      </p>
    </div>
  );
};

export default Login;