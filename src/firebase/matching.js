import { db } from "./config";
// Import de documentId pour exclure l'utilisateur courant
import { collection, getDocs, query, where, documentId } from "firebase/firestore"; 

/**
 * Trouver des Buddy compatibles selon :
 * - matière
 * - niveau
 * - disponibilité
 * * @param {string} subject - Matière recherchée
 * @param {string} level - Niveau de compétence
 * @param {string} availability - Disponibilité
 * @param {string} currentUserId - ID de l'utilisateur qui fait la recherche (pour l'exclure)
 */
export const findBuddy = async ({ subject, level, availability, currentUserId }) => {
  
  // ⚠️ NOTE CRITIQUE : Cette requête nécessite un INDEX COMPOSITE dans Firestore 
  // sur les champs 'subjects', 'level', 'availability', et documentId().
  
  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    where("subjects", "array-contains", subject), // Recherche dans le tableau des compétences
    where("level", "==", level),                 // Recherche par niveau
    where("availability", "==", availability),   // Recherche par disponibilité
    where(documentId(), "!=", currentUserId)     // Exclusion de l'utilisateur courant
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};