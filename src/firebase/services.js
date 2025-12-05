import { auth, db } from "./config";
import { collection, addDoc, getDocs } from "firebase/firestore";

// Exemple : récupérer tous les groupes
export const getGroups = async () => {
  const snapshot = await getDocs(collection(db, "groups"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Exemple : ajouter un nouveau groupe
export const addGroup = async (groupData) => {
  await addDoc(collection(db, "groups"), groupData);
};
