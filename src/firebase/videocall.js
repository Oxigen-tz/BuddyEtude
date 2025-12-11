import { db } from "./config";
// 🟢 Importation de 'getAuth' depuis firebase/auth pour le débogage d'auth
import { getAuth } from "firebase/auth"; 
import { 
    collection, 
    addDoc, 
    serverTimestamp,
    doc, 
    onSnapshot,
    deleteDoc,
    updateDoc
} from "firebase/firestore";

// Obtenir l'instance d'authentification pour la vérification
const auth = getAuth(); 

const CALLS_COLLECTION = "calls";
const CANDIDATES_COLLECTION = "candidates";

// =======================================================================
// CRÉATION ET GESTION DE L'APPEL
// =======================================================================

/**
 * Crée un nouveau document d'appel (ID unique) et initialise les participants.
 */
export const createCall = async (callerId, receiverId) => {
    // 🛑 DÉBOGAGE AUTHENTIFICATION : S'assurer que l'utilisateur est bien connecté et qu'il correspond.
    if (!auth.currentUser || auth.currentUser.uid !== callerId) {
        console.error("ERREUR AUTHENTIFICATION DANS createCall: L'utilisateur n'est pas connecté ou ne correspond pas à l'appelant.");
        throw new Error("Authentification Firebase requise pour créer l'appel."); 
    }
    
    // Le reste de l'exécution continue si l'authentification est OK
    const callDocRef = await addDoc(collection(db, CALLS_COLLECTION), {
        callerId,
        receiverId,
        status: 'calling', 
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

// 🟢 ALIAS pour les imports dans VideoCall.jsx
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

// 🟢 ALIAS pour les imports dans VideoCall.jsx
export const sendSignal = addCandidate;