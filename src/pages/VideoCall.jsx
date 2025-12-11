import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 🟢 CORRECTION CRITIQUE : Suppression de 'db' dans cette liste.
// On n'importe QUE les fonctions que nous avons créées dans videocall.js
import { 
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

    // 1. Initialisation de la Caméra
    useEffect(() => {
        const startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                stream.getTracks().forEach((track) => {
                    pc.current.addTrack(track, stream);
                });

                setCallStatus("Caméra active. En attente de connexion...");
            } catch (error) {
                console.error("Erreur caméra:", error);
                setCallStatus("ERREUR: Impossible d'accéder à la caméra. Vérifiez les permissions.");
            }
        };

        startWebcam();
        
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); 

    // 2. Gestion de la Signalisation (Écoute de Firebase)
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

    // 3. Gestion des candidats ICE locaux et création de l'Offre
    useEffect(() => {
        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                addCandidate(callId, event.candidate.toJSON());
            }
        };

        pc.current.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        const timer = setTimeout(async () => {
             if (!pc.current.localDescription) {
                 const offer = await pc.current.createOffer();
                 await pc.current.setLocalDescription(offer);
                 await setCallOffer(callId, { sdp: offer.sdp, type: offer.type });
             }
        }, 1000);

        return () => clearTimeout(timer);
    }, [callId]);

    // Fonction pour raccrocher
    const handleHangup = async () => {
        try {
            await endCall(callId); 
        } catch (e) {
            console.error("Erreur fin d'appel", e);
        }
        navigate('/dashboard'); 
        window.location.reload(); 
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
            <h2 className="text-xl mb-4 text-yellow-400 font-semibold">{callStatus}</h2>
            
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-5xl">
                {/* Vidéo Distante */}
                <div className="flex-1 bg-black aspect-video border-2 border-gray-700 rounded-lg relative overflow-hidden shadow-2xl">
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded text-sm">Partenaire</div>
                </div>

                {/* Vidéo Locale */}
                <div className="flex-1 bg-black aspect-video border-2 border-gray-700 rounded-lg relative overflow-hidden shadow-2xl">
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover transform scale-x-[-1]" 
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded text-sm">Moi</div>
                </div>
            </div>

            <button 
                onClick={handleHangup} 
                className="mt-8 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-lg"
            >
                Raccrocher
            </button>
        </div>
    );
};

export default VideoCall;