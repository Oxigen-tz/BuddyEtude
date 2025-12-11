import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext";
// Fonctions de Chat
import { sendMessage, subscribeToMessages } from "../firebase/chat";
// Fonctions de Groupe et Profil
import { getGroupData, getProfileData } from "../firebase/services"; 
// Fonctions d'Appel
import { createCall } from "../firebase/videocall"; 


const Chat = () => {
    const { groupId } = useParams();
    const navigate = useNavigate(); 
    const { user } = useAuth();
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null); 
    
    // Nouveaux états pour l'appel
    const [otherUserId, setOtherUserId] = useState(null); 
    const [otherUserName, setOtherUserName] = useState("Buddy"); 

    // =======================================================================
    // 1. Abonnement aux messages ET identification du partenaire
    // =======================================================================
    useEffect(() => {
        if (!groupId || !user) return;
        
        // --- PARTIE RECHERCHE PARTENAIRE ---
        const findOtherUser = async () => {
            try {
                const groupData = await getGroupData(groupId);
                
                if (groupData && groupData.members && groupData.members.length > 1) {
                    
                    // Trouver l'UID du partenaire qui n'est PAS l'utilisateur actuel
                    const partnerId = groupData.members.find(uid => uid !== user.uid);
                    
                    if (partnerId) {
                        setOtherUserId(partnerId);
                        
                        // Tenter de récupérer le nom pour l'affichage
                        const partnerProfile = await getProfileData(partnerId);
                        if (partnerProfile && partnerProfile.name) {
                            setOtherUserName(partnerProfile.name);
                        } else {
                            // Fallback : Utiliser l'UID si le profil n'est pas trouvé
                            setOtherUserName(`Partenaire: ${partnerId}`); 
                        }
                    } else {
                        setOtherUserId(null);
                        setOtherUserName("Aucun Autre Membre dans le Groupe");
                    }
                } else {
                    setOtherUserId(null);
                    setOtherUserName("Groupe Invalide ou Solitaire");
                }

            } catch (error) {
                // Erreur critique d'accès aux données du groupe (ex: Firestore down)
                console.error("Erreur critique d'accès aux données du groupe:", error);
                setOtherUserId(null);
                setOtherUserName("Erreur d'accès aux données");
            }
        };

        findOtherUser();
        
        // --- PARTIE ABONNEMENT AU CHAT ---
        setLoading(true);
        const unsubscribe = subscribeToMessages(groupId, (newMessages) => {
            setMessages(newMessages);
            setLoading(false);
        });
        
        return () => unsubscribe(); 
        
    }, [groupId, user]);


    // Fait défiler jusqu'au bas du chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    // =======================================================================
    // 2. Fonction pour lancer l'appel
    // =======================================================================
    const handleStartCall = async () => {
        if (!otherUserId) {
            alert("Impossible de trouver l'autre utilisateur pour lancer l'appel.");
            return;
        }

        try {
            // Crée un nouveau document 'call' dans Firestore
            const callId = await createCall(user.uid, otherUserId);
            
            // Redirige l'utilisateur vers la salle d'appel nouvellement créée
            navigate(`/call/${callId}`); 
            console.log("Appel créé et navigation lancée avec ID:", callId);
        } catch (error) {
            console.error("Erreur lors du lancement de l'appel:", error);
            alert("Erreur lors du lancement de l'appel vidéo. Vérifiez les règles Firestore pour /calls.");
        }
    };
    

    // 3. Fonction d'envoi de message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            await sendMessage(groupId, user.uid, user.displayName, newMessage.trim());
            setNewMessage("");
        } catch (error) {
            console.error("Erreur lors de l'envoi du message:", error);
        }
    };
    
    // =======================================================================
    // Rendu
    // =======================================================================

    if (loading) return <div className="p-6 text-center">Chargement des messages...</div>;
    if (!groupId) return <div className="p-6 text-center text-red-500">Aucun groupe de discussion sélectionné.</div>;

    return (
        <div className="flex flex-col h-[80vh] max-w-4xl mx-auto border border-gray-300 rounded-lg shadow-lg">
            
            {/* EN-TÊTE AVEC LE BOUTON D'APPEL */}
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
                <h2 className="text-xl font-bold">Chat avec {otherUserName}</h2>
                <button
                    onClick={handleStartCall}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
                    // Le bouton est activé si otherUserId est trouvé
                    disabled={!otherUserId} 
                >
                    📞 Démarrer l'Appel Vidéo
                </button>
            </div>
            
            {/* Zone d'affichage des messages */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50">
                {messages.map((msg, index) => (
                    <div 
                        key={msg.id || index} 
                        className={`flex ${msg.userId === user.uid ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-xs p-3 rounded-xl shadow-md ${
                            msg.userId === user.uid 
                            ? 'bg-blue-500 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 rounded-tl-none'
                        }`}>
                            <p className="font-semibold text-xs mb-1">{msg.userId === user.uid ? "Moi" : msg.user}</p>
                            <p>{msg.text}</p>
                            <span className="text-xs opacity-75 mt-1 block text-right">
                                {msg.createdAt ? msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Formulaire d'envoi */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                    disabled={loading || !newMessage.trim()}
                >
                    Envoyer
                </button>
            </form>
        </div>
    );
};

export default Chat;