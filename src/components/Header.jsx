import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // ÉCOUTE DES NOTIFICATIONS
  useEffect(() => {
    if (!user) return;

    // 1. On écoute tous les groupes où je suis membre
    const q = query(
      collection(db, "groups"), 
      where("members", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      
      snapshot.forEach(doc => {
        const groupData = doc.data();
        
        // S'il y a un message récent...
        if (groupData.lastMessageTime) {
            // ...et que ce n'est pas moi qui l'ai envoyé
            if (groupData.lastSenderId !== user.uid) {
                // ...je vérifie quand j'ai consulté ce groupe pour la dernière fois
                const lastRead = localStorage.getItem(`lastRead_${doc.id}`);
                const messageTime = groupData.lastMessageTime.toMillis(); // Convertir timestamp Firebase
                
                // Si le message est plus récent que ma lecture = Non Lu !
                if (!lastRead || messageTime > parseInt(lastRead)) {
                    count++;
                }
            }
        }
      });
      
      setUnreadCount(count);
    });

    // Petit hack pour forcer la mise à jour quand on change de page (ex: quand on ouvre un chat)
    const handleStorageChange = () => {
        // Cela ne recalcule pas tout mais permet de trigger des effets si besoin
        // Dans ce code simplifié, le onSnapshot fait déjà le travail principal
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
        unsubscribe();
        window.removeEventListener("storage", handleStorageChange);
    };
  }, [user]);


  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            📚 BuddyEtude
        </Link>

        {/* MENU */}
        {user ? (
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className={`hover:text-blue-600 font-medium ${location.pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-600'}`}>
              Accueil
            </Link>
            
            <Link to="/find-buddy" className={`hover:text-blue-600 font-medium ${location.pathname === '/find-buddy' ? 'text-blue-600' : 'text-gray-600'}`}>
              Trouver un binôme
            </Link>

            {/* BOUTON CHAT AVEC NOTIFICATION */}
            <Link to="/dashboard" className="relative group">
                <span className="text-2xl group-hover:scale-110 transition block">💬</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </Link>

            {/* AVATAR PROFIL */}
            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                        {user.displayName?.charAt(0) || "U"}
                    </div>
                )}
              </div>
            </Link>

            <button 
              onClick={logout} 
              className="bg-red-50 text-red-500 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">Connexion</Link>
            <Link to="/signup" className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
              Inscription
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;