import { createContext, useContext, useState, useEffect } from "react";
// NOTE: S'assurer que 'auth' est correctement exporté dans firebase/config.js
import { auth } from "../firebase/config"; 
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Ajout de l'état de chargement pour la vérification initiale de Firebase
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    // onAuthStateChanged écoute les changements d'état d'auth
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // L'état d'authentification est maintenant connu
    });
    
    // Fonction de nettoyage: très bien conservée
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Retourne le résultat pour permettre à Login.jsx de faire la redirection si succès
      return await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erreur de connexion Google:", error);
      // Lancer à nouveau l'erreur pour la gestion côté UI
      throw error; 
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      throw error; 
    }
  };

  // Valeurs fournies au reste de l'application
  const value = {
    user,
    loginWithGoogle,
    logout,
    loading // Ajout de l'état de chargement
  };
  
  // Option 1: Afficher un écran de chargement global tant que l'état d'auth n'est pas prêt
  if (loading) {
    return <div className="text-center p-20 text-lg">Préparation de l'application...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};