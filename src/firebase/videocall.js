import { db } from "./config";
import { 
    collection, 
    addDoc, 
    serverTimestamp,
    doc, 
    onSnapshot,
    setDoc,
    getDoc,
    deleteDoc,
    updateDoc
} from "firebase/firestore";

const CALLS_COLLECTION = "calls";
const CANDIDATES_COLLECTION = "candidates";

// =======================================================================
// CRÉATION ET GESTION DE L'APPEL
// =======================================================================

/**
 * Crée un nouveau document d'appel (ID unique) et initialise les participants.
 */
export const createCall = async (callerId, receiverId) => {
    const callDocRef = await addDoc(collection(db, CALLS_COLLECTION), {
        callerId,
        receiverId,
        status: 'calling', // Statut initial
        createdAt: serverTimestamp(),
    });
    return callDocRef.id;
};

/**
 * Met à jour le statut d'un appel (ex: 'accepted', 'rejected', 'ended').
 */
export const updateCallStatus = async (callId, status) => {
    const callDocRef = doc(db, CALLS_COLLECTION, callId);
    await updateDoc(callDocRef, {
        status: status,
        updatedAt: serverTimestamp()
    });
};

/**
 * Supprime un document d'appel.
 */
export const deleteCall = async (callId) => {
    const callDocRef = doc(db, CALLS_COLLECTION, callId);
    await deleteDoc(callDocRef);
};

// 🟢 EXPORT MANQUANT CORRIGÉ : Alias pour satisfaire l'importation dans VideoCall.jsx
export const endCall = deleteCall;


// =======================================================================
// SIGNALISATION (WebRTC)
// =======================================================================

/**
 * Écoute en temps réel les signaux (offre/réponse/candidats ICE) envoyés par l'appelant.
 */
export const listenForSignals = (callId, onCallUpdate, onCandidate) => {
    const callDocRef = doc(db, CALLS_COLLECTION, callId);

    // 1. Écouter le document principal pour l'offre, la réponse et le statut
    const unsubscribeCall = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data) {
            onCallUpdate(data);
        }
    });

    // 2. Écouter la sous-collection des candidats ICE
    const candidatesCollectionRef = collection(callDocRef, CANDIDATES_COLLECTION);
    const unsubscribeCandidates = onSnapshot(candidatesCollectionRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                onCandidate(change.doc.data());
            }
        });
    });

    // Retourne une fonction de nettoyage pour arrêter les deux écoutes
    return () => {
        unsubscribeCall();
        unsubscribeCandidates();
    };
};


/**
 * Enregistre l'offre (SDP) de l'appelant dans le document d'appel.
 */
export const setCallOffer = async (callId, offer) => {
    const callDocRef = doc(db, CALLS_COLLECTION, callId);
    await updateDoc(callDocRef, { offer: offer }); 
};

/**
 * Enregistre la réponse (SDP) du destinataire dans le document d'appel.
 */
export const setCallAnswer = async (callId, answer) => {
    const callDocRef = doc(db, CALLS_COLLECTION, callId);
    await updateDoc(callDocRef, { answer: answer });
};


/**
 * Ajoute un candidat ICE à la sous-collection du document d'appel.
 */
export const addCandidate = async (callId, candidate) => {
    const candidatesRef = collection(db, CALLS_COLLECTION, callId, CANDIDATES_COLLECTION);
    await addDoc(candidatesRef, candidate);
};

// Alias sendSignal (si votre Chat.jsx l'importe)
export const sendSignal = addCandidate;