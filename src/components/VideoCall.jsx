import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore'; // Import pour la base de données
import { db } from '../firebase/config';

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mettre à jour le statut "En appel" dans Firebase
  useEffect(() => {
    const setCallStatus = async (status) => {
        try {
            const groupRef = doc(db, "groups", roomId);
            await updateDoc(groupRef, {
                isCallActive: status
            });
        } catch (error) {
            console.error("Erreur statut appel:", error);
        }
    };

    // 1. Quand on arrive sur la page : On met l'appel à TRUE
    setCallStatus(true);

    // 2. Quand on quitte la page (nettoyage) : On met l'appel à FALSE
    return () => {
        setCallStatus(false);
    };
  }, [roomId]);


  const myMeeting = async (element) => {
    // 👇 REMPLACE PAR TES CLÉS ZEGO CLOUD 👇
    const appID = 670143226; // Remplacez le 0 par votre AppID (nombre)
    const serverSecret = "3825abfbfe83b806ada74ca2a8653358"; // Mettez votre ServerSecret entre guillemets
    // 👆 ---------------------------------- 👆

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, 
      serverSecret, 
      roomId, 
      user.uid, 
      user.displayName || "Étudiant"
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: element,
      sharedLinks: [{ name: 'Lien du groupe', url: window.location.href }],
      scenario: { mode: ZegoUIKitPrebuilt.GroupCall },
      showScreenSharingButton: true,
      onLeaveRoom: () => {
        navigate(`/chat/${roomId}`);
      },
    });
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex items-center justify-center" ref={myMeeting}>
      <div className="text-white animate-pulse">Chargement de la caméra...</div>
    </div>
  );
};

export default VideoCall;