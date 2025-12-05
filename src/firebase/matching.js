import { db } from "./config";
import { collection, getDocs, query, where } from "firebase/firestore";

/**
 * Trouver des Buddy compatibles selon :
 * - matière
 * - niveau
 * - disponibilité
 */
export const findBuddy = async ({ subject, level, availability }) => {
  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    where("subjects", "array-contains", subject),
    where("level", "==", level),
    where("availability", "==", availability)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
