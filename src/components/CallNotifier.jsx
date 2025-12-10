import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listenForSignals, updateCallStatus } from '../firebase/videocall';
import { db } from '../firebase/config';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';

const CallNotifier = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [incomingCall, setIncomingCall] = useState(null); // { id: callId, callerId: UID, status: 'ringing' }

    // 1. Écouter les appels entrants dirigés vers l'utilisateur
    useEffect(() => {
        // Arrêter si l'utilisateur n'est pas connecté ou si l'état d'auth n'est pas connu
        if (authLoading || !user) {
            setIncomingCall(null);
            return;
        }

        const callsRef = collection(db, 'calls');
        // Requête pour trouver un appel où: 
        // 1. L'utilisateur courant est le destinataire (receiverId)
        // 2. Le statut est 'ringing' (en attente)
        const q = query(
            callsRef,
            where('receiverId', '==', user.uid),
            where('status', '==', 'ringing'),
            limit(1) // On ne veut qu'un seul appel entrant à la fois
        );

        // Abonnement en temps réel
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                // Aucun appel entrant
                setIncomingCall(null);
            } else {
                // Appel entrant trouvé
                const callData = snapshot.docs[0];
                setIncomingCall({
                    id: callData.id,
                    ...callData.data(),
                });
            }
        }, (error) => {
            console.error("Erreur d'écoute des appels entrants:", error);
        });

        // Fonction de nettoyage
        return () => unsubscribe();
    }, [user, authLoading]);

    // Fonction pour rejoindre l'appel
    const handleAnswer = () => {
        if (!incomingCall) return;
        
        // 1. Mettre à jour le statut dans Firestore (optionnel, pour indiquer que l'appel est pris)
        updateCallStatus(incomingCall.id, 'connecting').catch(console.error);

        // 2. Rediriger l'utilisateur vers la salle d'appel en mode 'receiver'
        navigate(`/call/${incomingCall.id}?mode=receiver`);
    };

    // Fonction pour décliner l'appel
    const handleDecline = () => {
        if (!incomingCall) return;
        
        // 1. Mettre fin à l'appel dans Firestore (pour le nettoyer et notifier l'appelant)
        updateCallStatus(incomingCall.id, 'ended').catch(console.error);
        
        // 2. Masquer la notification
        setIncomingCall(null);
    };

    if (!incomingCall) return null;

    // Rendu de la notification flottante
    return (
        <div className="fixed top-20 right-4 p-4 bg-green-500 text-white rounded-lg shadow-2xl z-50 animate-bounce-slow">
            <p className="font-bold mb-2">📞 Appel Entrant de {incomingCall.callerId} !</p>
            <p className="text-sm mb-3">Voulez-vous rejoindre l'étude ?</p>
            
            <div className="flex space-x-3">
                <button 
                    onClick={handleAnswer} 
                    className="bg-white text-green-600 px-4 py-1 rounded font-semibold hover:bg-gray-100 transition"
                >
                    Répondre
                </button>
                <button 
                    onClick={handleDecline} 
                    className="bg-red-700 text-white px-4 py-1 rounded font-semibold hover:bg-red-800 transition"
                >
                    Décliner
                </button>
            </div>
        </div>
    );
};

export default CallNotifier;