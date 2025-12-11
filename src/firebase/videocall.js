// Fichier : src/firebase/videocall.js (Doit contenir cette fonction)

import { db } from "./config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ... (autres imports)

export const createCall = async (callerId, receiverId) => {
    const callDocRef = await addDoc(collection(db, "calls"), {
        callerId,
        receiverId,
        status: 'calling', // Statut initial
        createdAt: serverTimestamp(),
    });
    return callDocRef.id;
};