import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
      {/* En-tête */}
      <div className="absolute top-6 left-6">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition flex items-center gap-2"
        >
          ← Retour
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-2">Appel Vidéo en cours 🎥</h1>
      <p className="mb-8 text-gray-400 font-mono text-sm bg-gray-800 px-3 py-1 rounded-full">
        Salle ID : {roomId}
      </p>
      
      {/* Zone Vidéo Principale */}
      <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl border border-gray-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
        
        {/* Placeholder Avatar (En attendant la vraie caméra) */}
        <div className="text-center animate-pulse">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto">
            👤
          </div>
          <p className="text-gray-500">En attente de connexion vidéo...</p>
        </div>

        {/* Barre de contrôles (flottante en bas) */}
        <div className="absolute bottom-8 flex items-center gap-6 bg-gray-900/80 backdrop-blur-md px-8 py-4 rounded-full border border-gray-700 shadow-xl transition-transform transform translate-y-2 group-hover:translate-y-0">
           
           <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition hover:scale-110" title="Couper le micro">
             🎤
           </button>
           
           <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition hover:scale-110" title="Couper la caméra">
             📷
           </button>
           
           <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition hover:scale-110" title="Partager l'écran">
             💻
           </button>

           <div className="w-px h-8 bg-gray-600 mx-2"></div>

           <button 
             onClick={() => navigate("/dashboard")}
             className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition hover:scale-110 shadow-lg shadow-red-900/50"
             title="Raccrocher"
           >
             📞 Raccrocher
           </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;