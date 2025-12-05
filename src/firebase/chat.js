import { db } from "./config";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

/**
 * Envoyer un message dans un groupe
 * @param {string} groupId - ID du groupe
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} text - Message
 */
export const sendMessage = async (groupId, userName, text) => {
  const messagesRef = collection(db, `groups/${groupId}/messages`);
  await addDoc(messagesRef, {
    user: userName,
    text,
    createdAt: new Date()
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
    const messages = snapshot.docs.map(doc => doc.data());
    callback(messages);
  });
};
