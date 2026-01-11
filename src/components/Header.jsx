import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  return (
    <header className="bg-buddy-primary text-white shadow-md p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/" className="text-2xl font-extrabold tracking-tight hover:opacity-90 transition flex items-center gap-2">
          <span>🎓</span> BuddyEtude
        </Link>

        {/* NAVIGATION */}
        <nav>
          {user ? (
            <div className="flex items-center space-x-4 md:space-x-6">
              
              <Link 
                to="/find-buddy" 
                className="hover:text-blue-200 font-medium transition hidden md:block"
              >
                Trouver un Buddy
              </Link>

              <Link 
                to="/dashboard" 
                className="hover:text-blue-200 font-medium transition hidden md:block"
              >
                Dashboard
              </Link>

              {/* --- LE BOUTON PROFIL --- */}
              <Link 
                to="/profile" 
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-full transition shadow-sm border border-blue-500 cursor-pointer"
                title="Gérer mon profil"
              >
                <span className="text-sm">👋</span>
                <span className="font-bold hidden sm:inline">
                  Bonjour, {user.displayName ? user.displayName.split(" ")[0] : "Étudiant"}
                </span>
              </Link>

              {/* Bouton Déconnexion */}
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm font-bold transition shadow-sm"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="space-x-4">
              <Link to="/login" className="hover:underline font-medium">Connexion</Link>
              <Link to="/signup" className="bg-white text-buddy-primary px-4 py-2 rounded-full font-bold hover:bg-gray-100 transition shadow-sm">
                Inscription
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;