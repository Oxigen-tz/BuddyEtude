import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // 🟢 NOUVEAU : SYSTÈME DE PRÉSENCE "EN LIGNE"
  useEffect(() => {
    if (!user) return;

    // 1. Fonction qui dit "Je suis là"
    const updatePresence = async () => {
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                lastActive: serverTimestamp() // On note l'heure actuelle
            });
        } catch (error) {
            console.error("Erreur présence", error);
        }
    };

    // 2. On le lance tout de suite...
    updatePresence();

    // 3. ...puis on le relance toutes les 5 minutes
    const interval = setInterval(updatePresence, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
  // ---------------------------------------------------------


  // LOGIQUE NOTIFICATION (Inchangée)
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
            if (!lastRead || messageTime > parseInt(lastRead)) count++;
        }
      });
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, [user]);

  const NavLink = ({ to, label }) => {
      const isActive = location.pathname === to;
      return (
        <Link to={to} className={`px-3 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`}>
            {label}
        </Link>
      );
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-500 shadow-lg p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2 hover:opacity-90 transition">
            📚 <span className="hidden sm:inline">BuddyEtude</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex gap-2">
                <NavLink to="/dashboard" label="Accueil" />
                <NavLink to="/find-buddy" label="Trouver un binôme" />
            </div>

            <Link to="/dashboard" className="relative bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition flex items-center gap-2 group border border-white/20" title="Messages">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition">
                    <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9-9s-9 3.97-9 9c0 2.409 1.025 4.587 2.918 6.178.247.37.58.688.948.916a2.637 2.637 0 00-.712 1.6z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-sm hidden sm:inline">Messages</span>
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-blue-600 animate-bounce">{unreadCount}</span>}
            </Link>

            <Link to="/profile" className="flex items-center gap-2 ml-1 group">
              <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md group-hover:scale-105 transition">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                    {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-blue-600">{user.displayName?.charAt(0) || "U"}</div>}
                </div>
              </div>
            </Link>

            <button onClick={logout} className="bg-blue-900/30 hover:bg-red-500 text-white w-9 h-9 rounded-full flex items-center justify-center transition ml-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
            </button>
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/login" className="text-blue-100 hover:text-white font-medium transition">Connexion</Link>
            <Link to="/signup" className="bg-white text-blue-600 px-5 py-2 rounded-full font-bold hover:bg-gray-100 transition shadow-lg">Inscription</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;