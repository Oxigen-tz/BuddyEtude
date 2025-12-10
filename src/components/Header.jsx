import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  // Import des fonctions et de l'état de l'utilisateur
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/"); // Redirection vers l'accueil après la déconnexion
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  // Affichage conditionnel basé sur l'état d'authentification
  const navLinks = user ? (
    // Utilisateur connecté
    <>
      <Link className="mx-2 hover:text-gray-200 transition" to="/findbuddy">Trouver un Buddy</Link>
      <Link className="mx-2 hover:text-gray-200 transition" to="/dashboard">Dashboard</Link>
      <Link className="mx-2 hover:text-gray-200 transition" to="/profile">
        {user.displayName ? `Bonjour, ${user.displayName.split(' ')[0]}` : "Profil"}
      </Link>
      <button
        onClick={handleLogout}
        // Utilisation d'une couleur plus forte pour le bouton de déconnexion
        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 ml-4 rounded transition disabled:opacity-50"
        disabled={loading}
      >
        Déconnexion
      </button>
    </>
  ) : (
    // Utilisateur déconnecté
    <>
      <Link className="mx-2 hover:text-gray-200 transition" to="/login">Se connecter</Link>
      {/* Vous pouvez ajouter un lien vers une page d'inscription si elle existe */}
    </>
  );

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo/Titre */}
        <Link to="/" className="font-extrabold text-2xl hover:text-gray-200 transition">
          BuddyEtude
        </Link>
        
        {/* Navigation */}
        <nav className="flex items-center text-sm font-medium">
          {navLinks}
        </nav>
      </div>
    </header>
  );
};

export default Header;