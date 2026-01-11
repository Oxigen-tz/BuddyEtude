import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // LOGIQUE DE NOTIFICATION (Inchangée)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach(doc => {
        const groupData = doc.data();
        if (groupData.lastMessageTime && groupData.lastSenderId !== user.uid) {
            const lastRead = localStorage.getItem(`lastRead_${doc.id}`);
            const messageTime = groupData.lastMessageTime.toMillis();
            if (!lastRead || messageTime > parseInt(lastRead)) {
                count++;
            }
        }
      });
      setUnreadCount(count);
    });
    const handleStorageChange = () => {}; 
    window.addEventListener("storage", handleStorageChange);
    return () => { unsubscribe(); window.removeEventListener("storage", handleStorageChange); };
  }, [user]);

  // FONCTION POUR LES LIENS DU MENU (Pour éviter de répéter le style)
  const NavLink = ({ to, label, icon }) => {
      const isActive = location.pathname === to;
      return (
        <Link 
            to={to} 
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                isActive 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}
        >
            {icon && <span>{icon}</span>}
            {label}
        </Link>
      );
  };

  return (
    // CHANGEMENT ICI : Fond Bleu Dégradé
    <nav className="bg-gradient-to-r from-blue-700 to-blue-500 shadow-lg p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        
        {/* LOGO EN BLANC */}
        <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2 hover:opacity-90 transition">
            📚 BuddyEtude
        </Link>

        {/* MENU */}
        {user ? (
          <div className="flex items-center gap-4">
            <NavLink to="/dashboard" label="Accueil" />
            <NavLink to="/find-buddy" label="Trouver un binôme" />

            {/* BOUTON CHAT AVEC NOTIFICATION */}
            <Link to="/dashboard" className="relative group p-2 rounded-lg hover:bg-white/10 transition">
                <span className="text-2xl block text-white">💬</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-blue-600 animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </Link>

            {/* AVATAR AVEC BORDURE BLANCHE */}
            <Link to="/profile" className="flex items-center gap-2 ml-2 group">
              <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md group-hover:scale-105 transition">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-blue-600">
                            {user.displayName?.charAt(0) || "U"}
                        </div>
                    )}
                </div>
              </div>
            </Link>

            <button 
              onClick={logout} 
              className="bg-blue-800/50 text-blue-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition ml-2 backdrop-blur-sm"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/login" className="text-blue-100 hover:text-white font-medium transition">Connexion</Link>
            <Link to="/signup" className="bg-white text-blue-600 px-5 py-2 rounded-full font-bold hover:bg-gray-100 transition shadow-lg">
              Inscription
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;