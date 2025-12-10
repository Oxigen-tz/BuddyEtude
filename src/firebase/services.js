import { db } from "./config";
import { 
    collection, 
    doc, 
    getDocs, 
    query, 
    where, 
    setDoc, 
    serverTimestamp,
    getDoc 
} from "firebase/firestore";

const USERS_COLLECTION = "users";
const GROUPS_COLLECTION = "groups";

// =======================================================================
// SERVICES UTILISATEUR
// =======================================================================

/**
 * Crée ou met à jour le profil utilisateur dans Firestore après une connexion réussie.
 * Ceci est crucial pour garantir que le document users/{user.uid} existe.
 */
export const syncUserProfile = async (user) => {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        // Crée le document utilisateur s'il n'existe pas (Premier Login)
        await setDoc(userRef, {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL || null,
            level: "Débutant", // Valeur par défaut
            availability: "Flexible", // Valeur par défaut
            skills: [],
            wishlist: [],
            createdAt: serverTimestamp()
        }, { merge: true });
    }
    // Si le document existe, on ne fait rien pour ne pas écraser les données personnalisées.
};

/**
 * Récupère le profil complet de l'utilisateur.
 */
export const getProfileData = async (userId) => {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

/**
 * Met à jour le profil utilisateur.
 */
export const updateProfileData = async (userId, data) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, data, { merge: true });
};

// =======================================================================
// SERVICES GROUPES ET MATCHING
// =======================================================================

/**
 * Récupère tous les groupes dont l'utilisateur est membre.
 */
export const getGroups = async (userId) => {
    const groupsRef = collection(db, GROUPS_COLLECTION);
    
    // Requête pour filtrer les groupes où le tableau 'members' contient l'ID de l'utilisateur
    // NOTE: Pour les tableaux de grande taille, ce type de requête peut être limité par Firestore.
    const q = query(groupsRef, where("members", "array-contains", userId));

    const querySnapshot = await getDocs(q);
    const groups = [];
    querySnapshot.forEach((doc) => {
        groups.push({ id: doc.id, ...doc.data() });
    });
    return groups;
};

// ... (Ajoutez ici toutes les autres fonctions de services que vous avez)