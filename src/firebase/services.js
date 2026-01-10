import { db } from "./config";
import { 
    collection, 
    doc, 
    getDocs, 
    query, 
    where, 
    setDoc, 
    addDoc, // <--- AJOUTÉ ICI
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
 */
export const syncUserProfile = async (user) => {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        await setDoc(userRef, {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL || null,
            level: "Débutant",
            availability: "Flexible",
            skills: [],
            wishlist: [],
            createdAt: serverTimestamp()
        }, { merge: true });
    }
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
 * Récupère les données d'un groupe spécifique par son ID.
 */
export const getGroupData = async (groupId) => {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

/**
 * Récupère tous les groupes dont l'utilisateur est membre.
 */
export const getGroups = async (userId) => {
    const groupsRef = collection(db, GROUPS_COLLECTION);
    const q = query(groupsRef, where("members", "array-contains", userId));

    const querySnapshot = await getDocs(q);
    const groups = [];
    querySnapshot.forEach((doc) => {
        groups.push({ id: doc.id, ...doc.data() });
    });
    return groups;
};

/**
 * Crée un groupe de discussion privé (Chat) entre deux utilisateurs.
 * NOUVELLE FONCTION AJOUTÉE
 */
export const startDirectChat = async (currentUserId, targetUserId, targetUserName) => {
    try {
        // On crée un nouveau document dans la collection "groups"
        const groupRef = await addDoc(collection(db, GROUPS_COLLECTION), {
            name: `Chat avec ${targetUserName}`, // Nom par défaut
            members: [currentUserId, targetUserId], // Les 2 participants
            type: "private", // Type de groupe
            createdAt: serverTimestamp(),
            lastMessage: "Discussion commencée",
            lastMessageTime: serverTimestamp()
        });
        
        return groupRef.id; // On retourne l'ID du nouveau groupe pour la redirection
    } catch (error) {
        console.error("Erreur lors de la création du chat:", error);
        throw error;
    }
};