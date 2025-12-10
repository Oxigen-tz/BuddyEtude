import React, { createContext, useContext, useState, useEffect } from "react";
import { 
    onAuthStateChanged, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut 
} from "firebase/auth";
import { auth } from "../firebase/config"; 
// 🟢 NOUVEL IMPORT : La fonction pour créer le profil Firestore
import { syncUserProfile } from "../firebase/services"; 

// Crée le Contexte
const AuthContext = createContext();

// Hook personnalisé pour l'utilisation du contexte
export const useAuth = () => useContext(AuthContext);

// Fournisseur de Contexte
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // État de chargement initial

    // Écoute les changements d'état d'authentification (login, logout, refresh)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false); // L'état initial est connu
        });
        return unsubscribe; // Nettoyage lors du démontage
    }, []);

    // Fonction de connexion Google
    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user; 
            
            // 🟢 ÉTAPE CRUCIALE : Crée ou synchronise le document utilisateur dans Firestore
            await syncUserProfile(user); 

            // L'onAuthStateChanged ci-dessus mettra à jour l'état du contexte (setUser)
            return result;
        } catch (error) {
            console.error("Erreur de connexion Google:", error);
            throw error; 
        }
    };

    // Fonction de déconnexion
    const logout = () => signOut(auth);

    const value = {
        user,
        loading,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};