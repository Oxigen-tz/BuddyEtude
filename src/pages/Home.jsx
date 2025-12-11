import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    db, 
    listenForSignals, 
    setCallOffer, 
    setCallAnswer, 
    addCandidate,
    endCall 
} from '../firebase/videocall'; 

// Serveurs STUN (Google)
const servers = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    ],
    iceCandidatePoolSize: 10,
};

const VideoCall = () => {
    const { callId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [localStream, setLocalStream] = useState(null);
    const [callStatus, setCallStatus] = useState("Initialisation...");
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pc = useRef(new RTCPeerConnection(servers));

    // 1. Initialisation Caméra
    useEffect(() => {
        const startWebcam = async () => {
            try {
                // Demande l'accès vidéo/audio
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                
                // Attache le flux à la balise vidéo
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Ajoute les pistes à la connexion PeerConnection
                stream.getTracks().forEach((track) => {
                    pc.current.addTrack(track, stream);
                });

                setCallStatus("Caméra active. En attente de connexion...");
            } catch (error) {
                console.error("Erreur caméra:", error);
                // 🛑 PAS DE REDIRECTION ICI, JUSTE UN MESSAGE
                setCallStatus("ERREUR: Accès caméra refusé ou impossible.");
            }
        };
        startWebcam();
        
        // Nettoyage
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); 

    // 2. Signalisation (Reste inchangé pour la logique)
    useEffect(() => {
        if (!callId) return;

        const unsubscribe = listenForSignals(callId, async (data) => {
            if (data.status) setCallStatus(`Statut: ${data.status}`);
            
            if (data.offer && !pc.current.currentRemoteDescription) {
                await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);
                await setCallAnswer(callId, { type: answer.type, sdp: answer.sdp });
            }
            if (data.answer && !pc.current.currentRemoteDescription) {
                await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        }, (candidateData) => {
            if (pc.current.remoteDescription) {
                pc.current.addIceCandidate(new RTCIceCandidate(candidateData));
            }
        });
        return () => unsubscribe();
    }, [callId]);

    // 3. Gestion ICE et Offre
    useEffect(() => {
        pc.current.onicecandidate = (event) => {
            if (event.candidate) addCandidate(callId, event.candidate.toJSON());
        };
        pc.current.ontrack = (event) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        // Créer l'offre après un délai court
        setTimeout(async () => {
             // Vérification simple pour éviter de refaire une offre si on n'est pas l'initiant
             // (Dans un code parfait, on vérifierait si on est callerId)
             if (!pc.current.localDescription) {
                 const offer = await pc.current.createOffer();
                 await pc.current.setLocalDescription(offer);
                 await setCallOffer(callId, { sdp: offer.sdp, type: offer.type });
             }
        }, 1000);
    }, [callId]);

    const handleHangup = async () => {
        await endCall(callId); 
        navigate('/dashboard'); 
        window.location.reload(); 
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
            <h2 className="text-xl mb-4 text-yellow-400">{callStatus}</h2>
            
            <div className="flex gap-4 w-full max-w-4xl">
                {/* Vidéo Locale */}
                <div className="flex-1 bg-black aspect-video border border-gray-600 relative">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                    <span className="absolute bottom-2 left-2 bg-black/50 px-2 rounded">Moi</span>
                </div>
                {/* Vidéo Distante */}
                <div className="flex-1 bg-black aspect-video border border-gray-600 relative">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-black/50 px-2 rounded">Partenaire</span>
                </div>
            </div>

            <button onClick={handleHangup} className="mt-6 bg-red-600 px-8 py-3 rounded-full font-bold">
                Raccrocher
            </button>
        </div>
    );
};

export default VideoCall;