import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth } from '../context/AuthContext';

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fonction d'initialisation de l'appel
  const myMeeting = async (element) => {
    // 👇 REMPLACEZ CES DEUX LIGNES PAR VOS CLÉS ZEGO CLOUD 👇
    const appID = 670143226; // Remplacez le 0 par votre AppID (nombre)
    const serverSecret = "3825abfbfe83b806ada74ca2a8653358"; // Mettez votre ServerSecret entre guillemets
    // 👆 -------------------------------------------------- 👆

    // Génération du token de connexion (Mode Test)
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, 
      serverSecret, 
      roomId, // L'ID du groupe sert d'ID de salle
      user.uid, // ID unique de l'utilisateur
      user.displayName || "Étudiant" // Nom affiché
    );

    // Création de l'instance
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    // Rejoindre la salle
    zp.joinRoom({
      container: element,
      sharedLinks: [
        {
          name: 'Lien du groupe',
          url: window.location.href, // Lien à partager
        },
      ],
      scenario: {
        mode: ZegoUIKitPrebuilt.GroupCall, // Mode appel de groupe
      },
      showScreenSharingButton: true, // Autoriser le partage d'écran
      
      // Quand on quitte, on retourne au chat
      onLeaveRoom: () => {
        navigate(`/chat/${roomId}`);
      },
    });
  };

  return (
    <div
      className="w-full h-screen bg-gray-900 flex items-center justify-center"
      ref={myMeeting}
    >
      <div className="text-white animate-pulse">Chargement de la caméra...</div>
    </div>
  );
};

export default VideoCall;