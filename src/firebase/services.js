import { auth, db } from "./config";
import { collection, addDoc, getDocs, doc, getDoc, query, where } from "firebase/firestore"; 
import { serverTimestamp } from "firebase/firestore"; 

// =======================================================================
// FONCTIONS DE GESTION DES GROUPES
// =======================================================================

// Récupérer les groupes auxquels l'utilisateur appartient
export const getGroups = async (userId) => {
    // Si userId est fourni, on filtre par appartenance (suppose un champ 'members' de type array dans 'groups')
    const groupsRef = collection(db, "groups");
    
    // NOTE: Ceci nécessite un autre index composite si vous utilisez ce filtre
    let q = query(groupsRef, where("members", "array-contains", userId));

    // Si pas de filtre, on récupère tout (attention à la scalabilité)
    if (!userId) {
      q = groupsRef; 
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
    }));
};

// Ajouter un nouveau groupe (avec ID du créateur)
export const addGroup = async (groupData) => {
    if (!auth.currentUser) {
        throw new Error("L'utilisateur doit être connecté pour créer un groupe.");
    }
    
    const dataWithCreator = {
        ...groupData,
        creatorId: auth.currentUser.uid,
        members: [auth.currentUser.uid], // Le créateur est le premier membre
        createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "groups"), dataWithCreator);
    // Retourne l'ID pour la redirection vers la page du nouveau groupe
    return docRef.id; 
};

// =======================================================================
// FONCTION DE GESTION DU PROFIL
// =======================================================================

/**
 * Récupère le document complet du profil utilisateur depuis la collection 'users'.
 * @param {string} userId - L'UID de l'utilisateur
 */
export const getProfileData = async (userId) => {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        // Optionnel : Créer un document utilisateur initial s'il n'existe pas (inscription)
        return null;
    }
};