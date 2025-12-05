import { db } from "./config";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

/**
 * Ajouter une compétence à la wishlist
 */
export const addSkillToWishlist = async (userId, skill) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    wishlist: arrayUnion(skill)
  });
};
