import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VideoCall = () => {
  const { roomId } = useParams(); // L'ID du groupe sert d'ID de salle
  const navigate = useNavigate();
  const { user } = useAuth();
  const jitsiContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. On charge le script Jitsi Meet dynamiquement
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) {
        startConference();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = startConference;
      document.body.appendChild(script);
    };

    // 2. Configuration et Lancement de la conférence
    const startConference = () => {
      setLoading(false);
      
      if (!jitsiContainerRef.current) return;

      // Nettoyage préventif si une instance existe déjà
      jitsiContainerRef.current.innerHTML = "";

      const domain = "meet.jit.si";
      const options = {
        // Nom unique de la salle : BuddyEtude + ID du groupe
        roomName: `BuddyEtude-${roomId}`,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        lang: "fr",
        userInfo: {
          email: user.email,
          displayName: user.displayName || "Étudiant",
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false, // On entre direct sans salle d'attente
          disableDeepLinking: true, // Évite d'ouvrir l'app mobile, reste sur le web
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'tileview', 'download', 'help',
            'mute-everyone', 'security'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
      };

      // Création de l'instance Jitsi
      const api = new window.JitsiMeetExternalAPI(domain, options);

      // Événement : Quand on raccroche, on retourne au chat
      api.addEventListener("videoConferenceLeft", () => {
        navigate(`/chat/${roomId}`); // Retour au groupe
        api.dispose(); // Nettoyage
      });
    };

    loadJitsiScript();

    // Nettoyage quand on quitte la page (bouton retour navigateur)
    return () => {
      if (window.JitsiMeetExternalAPI) {
        // On ne peut pas facilement supprimer l'instance externe ici sans référence,
        // mais le nettoyage du DOM se fera automatiquement par React.
      }
    };
  }, [roomId, user, navigate]);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Bouton retour de secours (en haut à gauche) */}
      <div className="absolute top-4 left-4 z-50">
        <button 
          onClick={() => navigate(`/chat/${roomId}`)}
          className="bg-black/50 hover:bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur-sm transition flex items-center gap-2 text-sm font-bold"
        >
          ← Retour au Chat
        </button>
      </div>

      {/* Message de chargement */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="text-lg font-medium">Connexion à la salle de cours...</p>
          </div>
        </div>
      )}

      {/* Conteneur Jitsi (La vidéo s'affiche ici) */}
      <div 
        ref={jitsiContainerRef} 
        className="w-full h-full"
      />
    </div>
  );
};

export default VideoCall;