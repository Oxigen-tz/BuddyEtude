import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import SimplePeer from 'simple-peer';
import { useAuth } from '../context/AuthContext';
import { 
    listenForSignals, 
    sendSignal, 
    updateCallStatus, 
    endCall 
} from '../firebase/videocall'; 

// Configuration des serveurs STUN/TURN
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
        // NOTE: Ajoutez ici un serveur TURN pour une meilleure fiabilité dans des réseaux complexes (NAT restrictif)
    ]
};

const VideoCall = () => {
    // callId: ID de la salle d'appel (Firestore Doc ID)
    const { callId } = useParams(); 
    // mode: Récupère 'receiver' si l'utilisateur rejoint l'appel via la notification
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode'); 
    
    const navigate = useNavigate();
    const { user } = useAuth();

    const [peer, setPeer] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callStatus, setCallStatus] = useState('initializing'); // 'ringing', 'connecting', 'active', 'ended', 'media-error'
    
    // Références pour les balises vidéo
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    
    // Réf pour l'abonnement Firestore (pour le cleanup)
    const unsubscribeRef = useRef(null); 
    
    // Rôle de l'utilisateur dans l'appel
    const isInitiator = mode !== 'receiver';

    // =======================================================================
    // 1. Initialisation de la caméra/micro et création du Peer
    // =======================================================================
    useEffect(() => {
        if (!user || !callId) return;

        let currentPeer = null;

        const setupMediaAndPeer = async () => {
            try {
                // A. Obtenir les flux média
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                
                // Mettre le flux local sur la balise vidéo
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // B. Initialiser le Peer
                currentPeer = new SimplePeer({
                    initiator: isInitiator, 
                    trickle: true,
                    stream: stream,
                    config: ICE_SERVERS
                });

                setPeer(currentPeer);
                setCallStatus(isInitiator ? 'ringing' : 'connecting');
                
                // C. Événements Simple-Peer
                
                // Lorsque le Peer génère un signal (Offer, Answer, Candidate), on l'envoie à Firestore
                currentPeer.on('signal', (data) => {
                    sendSignal(callId, { userId: user.uid, data: data }).catch(console.error);
                });

                // Lorsque le flux vidéo/audio distant arrive
                currentPeer.on('stream', (stream) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = stream;
                    }
                    setRemoteStream(stream);
                    setCallStatus('active');
                    updateCallStatus(callId, 'active').catch(console.error);
                });

                currentPeer.on('connect', () => {
                    console.log('WebRTC: Connexion établie!');
                    setCallStatus('active');
                });

                currentPeer.on('close', () => handleEndCall(false, "Appel terminé par le partenaire."));
                currentPeer.on('error', (err) => {
                    console.error('Erreur Peer:', err);
                    handleEndCall(true, "La connexion vidéo a échoué.");
                });

            } catch (err) {
                console.error("Erreur d'accès aux médias:", err);
                setCallStatus('media-error');
            }
        };

        setupMediaAndPeer();
            
        // D. Fonction de Nettoyage (s'exécute au démontage du composant ou si l'ID change)
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (currentPeer) currentPeer.destroy();
            if (unsubscribeRef.current) unsubscribeRef.current();
            
            // Si c'est l'appelant qui raccroche, on nettoie le document Firestore
            if (isInitiator) endCall(callId).catch(console.error);
        };
    }, [user, callId, mode]); 


    // =======================================================================
    // 2. Écoute des signaux Firestore entrants
    // =======================================================================
    useEffect(() => {
        // Déclencher l'écoute uniquement après l'initialisation du Peer
        if (!user || !callId || !peer || unsubscribeRef.current) return;

        // Établir l'abonnement Firestore pour les signaux
        unsubscribeRef.current = listenForSignals(callId, (callData) => {
            if (!callData) {
                // Le document a été supprimé par l'autre utilisateur
                handleEndCall(false, "Le partenaire a raccroché ou l'appel a été annulé.");
                return;
            }
            
            // Traiter les signaux entrants
            callData.signals.forEach(signal => {
                // S'assurer de ne traiter que le signal de l'autre utilisateur
                if (signal.userId !== user.uid) {
                    try {
                        peer.signal(signal.data);
                    } catch (e) {
                        console.error("Erreur lors de la signalisation:", e);
                    }
                }
            });
            
            // Mettre à jour le statut
            setCallStatus(callData.status);

            // Si le statut est mis à jour à 'ended' par l'autre partie
            if (callData.status === 'ended') {
                 handleEndCall(false, "Appel terminé par le partenaire.");
            }
        });

        // Nettoyage de l'abonnement à Firestore
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };

    }, [peer, user, callId]); 


    // =======================================================================
    // 3. Fonction pour raccrocher
    // =======================================================================
    const handleEndCall = (isError = false, message = "Appel terminé.") => {
        // Stopper les médias
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        
        // Détruire la connexion Peer
        if (peer) peer.destroy();
        
        // Arrêter l'écoute Firestore
        if (unsubscribeRef.current) unsubscribeRef.current();
        
        // Supprimer le document Firestore (si l'appelant le fait ou si erreur)
        // Laisser le destinataire supprimer le document si c'est lui qui raccroche.
        endCall(callId).catch(console.error); 
        
        alert(message);
        navigate('/findbuddy');
    };
    
    // =======================================================================
    // 4. Rendu conditionnel et états
    // =======================================================================
    
    if (callStatus === 'media-error') {
        return <div className="p-6 text-red-600 text-center font-semibold">
            Erreur: Impossible d'accéder à votre caméra et microphone. Veuillez vérifier les autorisations.
        </div>;
    }
    if (!user) return <div className="p-6 text-center text-red-500">Authentification requise.</div>;
    if (callStatus === 'initializing') return <div className="p-6 text-center">Initialisation de l'appel...</div>;


    // Rendu de l'interface
    return (
        <div className="p-6 max-w-6xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
                {callStatus === 'active' ? "Appel Vidéo Actif" : `Statut: ${callStatus.toUpperCase()}`}
            </h1>
            <p className="text-sm text-gray-500 mb-6">ID de l'appel: {callId}</p>

            {/* Affichage des Vidéos */}
            <div className="flex justify-center space-x-6">
                
                {/* Vidéo Locale (Moi) */}
                <div className="w-1/3 relative bg-black border-4 border-blue-500 rounded-lg shadow-xl overflow-hidden">
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover"></video>
                    <div className="absolute top-0 left-0 bg-blue-500 bg-opacity-70 text-white text-xs px-2 py-1">Moi</div>
                </div>

                {/* Vidéo Distante (Buddy) */}
                <div className="w-2/3 relative border-4 border-gray-300 rounded-lg shadow-xl overflow-hidden">
                    {callStatus === 'active' ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 p-10 min-h-64">
                            {callStatus === 'ringing' && <p className="animate-pulse">En attente de la réponse du Buddy...</p>}
                            {callStatus === 'connecting' && <p>Négociation de la connexion...</p>}
                            {callStatus === 'ended' && <p>Appel terminé.</p>}
                            
                            {/* Correction de l'erreur JSX : la balise de fermeture est correcte */}
                        </div>
                    )}
                    <div className="absolute top-0 left-0 bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1">Buddy</div>
                </div>
            </div>

            {/* Bouton Raccrocher */}
            <button 
                onClick={() => handleEndCall()}
                className="mt-6 bg-buddy-accent hover:bg-red-700 text-white px-8 py-3 rounded-full shadow-lg font-bold transition disabled:opacity-50"
                disabled={callStatus === 'ended'}
            >
                Raccrocher
            </button>
        </div>
    );
};

export default VideoCall;