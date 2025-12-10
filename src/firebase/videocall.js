import { db } from "./config";
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

const CALLS_COLLECTION = "calls";

/**
 * 1. Crée un nouveau document d'appel dans Firestore.
 * @param {string} callerId - UID de l'utilisateur qui initie l'appel.
 * @param {string} receiverId - UID de l'utilisateur qui doit recevoir l'appel.
 * @returns {string} L'ID unique de la salle d'appel.
 */
export const createCall = async (callerId, receiverId) => {
  const callDocRef = doc(collection(db, CALLS_COLLECTION));
  const callId = callDocRef.id;

  await setDoc(callDocRef, {
    callerId: callerId,
    receiverId: receiverId,
    status: 'ringing', 
    createdAt: serverTimestamp(),
    signals: []
  });
  
  return callId;
};

/**
 * Fonction utilitaire pour récupérer l'historique des signaux
 */
const getSignalHistory = async (callId) => {
  const docRef = doc(db, CALLS_COLLECTION, callId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().signals || [] : [];
};

/**
 * 2. Écoute les changements dans la salle d'appel spécifique.
 * @param {string} callId - ID de la salle d'appel.
 * @param {function} onUpdate - Callback exécuté à chaque mise à jour.
 * @returns {function} Fonction d'annulation de l'abonnement.
 */
export const listenForSignals = (callId, onUpdate) => {
  const callDocRef = doc(db, CALLS_COLLECTION, callId);
  
  return onSnapshot(callDocRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      onUpdate({ id: docSnapshot.id, ...docSnapshot.data() });
    } else {
      onUpdate(null);
    }
  });
};

/**
 * 3. Envoie un nouveau signal de WebRTC à la salle.
 * @param {string} callId - ID de la salle d'appel.
 * @param {Object} signalData - Données de signalisation.
 */
export const sendSignal = async (callId, signalData) => {
  const callDocRef = doc(db, CALLS_COLLECTION, callId);
  
  // Cette méthode est simple pour le prototype, mais peut atteindre la limite
  // de taille de document Firestore si le chat est trop long ou si les signaux ICE sont nombreux.
  await updateDoc(callDocRef, {
    signals: [...(await getSignalHistory(callId)), signalData]
  });
};

/**
 * 4. Met à jour le statut de l'appel.
 */
export const updateCallStatus = async (callId, status) => {
  const callDocRef = doc(db, CALLS_COLLECTION, callId);
  await updateDoc(callDocRef, { status: status });
};

/**
 * 5. Termine et supprime l'appel (cleanup).
 */
export const endCall = async (callId) => {
  const callDocRef = doc(db, CALLS_COLLECTION, callId);
  await deleteDoc(callDocRef);
};