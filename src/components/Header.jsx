import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <Link to="/" className="font-bold text-xl">BuddyEtude</Link>
      <nav>
        {user ? (
          <>
            <Link className="mx-2" to="/dashboard">Dashboard</Link>
            <Link className="mx-2" to="/profile">Profil</Link>
          </>
        ) : (
          <Link to="/login">Se connecter</Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
