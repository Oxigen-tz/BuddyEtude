import { db, auth } from "./config";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

/**
 * Ajouter une compétence à la wishlist
 * @param {string} userId - ID de l'utilisateur
 * @param {string} skill - Compétence à ajouter
 */
export const addSkillToWishlist = async (userId, skill) => {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error("Action non autorisée. Vous ne pouvez modifier que votre propre liste.");
  }
  
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    wishlist: arrayUnion(skill) // Ajoute l'élément si non présent
  });
};

/**
 * Supprimer une compétence de la wishlist
 * @param {string} userId - ID de l'utilisateur
 * @param {string} skill - Compétence à supprimer
 */
export const removeSkillFromWishlist = async (userId, skill) => {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error("Action non autorisée. Vous ne pouvez modifier que votre propre liste.");
  }
  
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    wishlist: arrayRemove(skill) // Retire l'élément
  });
};