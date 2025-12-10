import { db } from "./config";
// Import de serverTimestamp pour une heure de création stable
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore"; 

/**
 * Envoyer un message dans un groupe
 * @param {string} groupId - ID du groupe
 * @param {string} userId - ID unique de l'utilisateur (NOUVEAU)
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} text - Message
 */
export const sendMessage = async (groupId, userId, userName, text) => {
  const messagesRef = collection(db, `groups/${groupId}/messages`);
  
  // Ajout de userId et utilisation de serverTimestamp
  await addDoc(messagesRef, {
    userId: userId, // ESSENTIEL pour la sécurité et l'UX
    user: userName,
    text,
    createdAt: serverTimestamp() // ESSENTIEL pour un horodatage cohérent
  });
};

/**
 * Écouter les messages en temps réel
 * @param {string} groupId - ID du groupe
 * @param {function} callback - Fonction à appeler à chaque mise à jour
 */
export const subscribeToMessages = (groupId, callback) => {
  const messagesRef = collection(db, `groups/${groupId}/messages`);
  const q = query(messagesRef, orderBy("createdAt"));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id, // Ajout de l'ID pour la clé React dans ChatBox.jsx
      ...doc.data(),
      // Conversion de l'horodatage Firestore en objet Date si présent
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(), 
    }));
    callback(messages);
  });
};