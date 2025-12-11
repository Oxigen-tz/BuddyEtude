// Fichier : src/pages/Chat.jsx

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom"; // 🟢 AJOUTER useNavigate
import { useAuth } from "../context/AuthContext";
import { sendMessage, subscribeToMessages } from "../firebase/chat";
// 🟢 IMPORTER LA LOGIQUE DE L'APPEL
import { createCall } from "../firebase/videocall"; // ⬅️ VÉRIFIEZ LE CHEMIN
// 🟢 IMPORTER LA LOGIQUE DE MATCHING POUR TROUVER L'UID DE L'AUTRE
import { getProfileData } from "../firebase/services"; // ⬅️ OU getGroupData si c'est plus simple

const Chat = () => {
    const { groupId } = useParams();
    const navigate = useNavigate(); // 🟢 INITIALISER useNavigate
    const { user } = useAuth();
    
    // ... (autres états)

    // 🟢 NOUVEL ÉTAT POUR L'AUTRE UTILISATEUR
    const [otherUserId, setOtherUserId] = useState(null); 
    const [otherUserName, setOtherUserName] = useState("Buddy"); 

    // =======================================================================
    // 0. Identifier le partenaire de chat
    // =======================================================================
    useEffect(() => {
        if (!groupId || !user) return;
        
        // La logique ici est d'aller chercher les membres du groupe, et de trouver 
        // l'UID qui n'est PAS l'UID de l'utilisateur actuel.
        // NOTE: Ceci nécessite une fonction getGroupData dans firebase/services.js
        const findOtherUser = async () => {
            // (La logique réelle doit se trouver ici pour trouver l'UID du partenaire)
            // Pour l'exemple de test, si on suppose que vous êtes le seul,
            // ou si vous avez deux UID dans le tableau members, trouvez l'UID adverse.
            
            // Exemple (Hypothèse: Une fonction existe qui retourne les membres du groupe):
            // const groupData = await getGroupData(groupId);
            // const partnerId = groupData.members.find(uid => uid !== user.uid);
            
            // Pour l'instant, on utilise l'ID de l'autre membre du document de groupe créé manuellement.
            // On le laisse à null pour ne pas planter, mais la fonction doit exister.
            setOtherUserId("UID_DU_PARTENAIRE_ICI"); 
            setOtherUserName("Partenaire de Chat");
        };

        findOtherUser();
    }, [groupId, user]);


    // =======================================================================
    // 3. Fonction pour lancer l'appel
    // =======================================================================
    const handleStartCall = async () => {
        if (!otherUserId) {
            alert("Impossible de trouver l'autre utilisateur pour l'appel.");
            return;
        }

        try {
            // Crée un nouveau document 'call' dans Firestore
            const callId = await createCall(user.uid, otherUserId);
            
            // Redirige l'utilisateur vers la salle d'appel nouvellement créée
            navigate(`/call/${callId}`); 
        } catch (error) {
            console.error("Erreur lors du lancement de l'appel:", error);
            alert("Erreur lors du lancement de l'appel vidéo.");
        }
    };
    
    // =======================================================================
    // Rendu
    // =======================================================================

    return (
        <div className="flex flex-col h-[80vh] max-w-4xl mx-auto border border-gray-300 rounded-lg shadow-lg">
            
            {/* 🟢 EN-TÊTE AVEC LE BOUTON D'APPEL */}
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
                <h2 className="text-xl font-bold">Chat avec {otherUserName}</h2>
                <button
                    onClick={handleStartCall}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
                    disabled={!otherUserId} // Désactivé si on ne connaît pas l'ID du partenaire
                >
                    📞 Démarrer l'Appel Vidéo
                </button>
            </div>
            {/* ... le reste du chat est inchangé ... */}
        </div>
    );
};

export default Chat;