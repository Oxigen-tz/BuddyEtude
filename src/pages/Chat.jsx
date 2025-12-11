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
    
    // États pour l'appel vidéo
    const [otherUserId, setOtherUserId] = useState(null); 
    const [otherUserName, setOtherUserName] = useState("Buddy"); 

    // =======================================================================
    // 1. Abonnement aux messages ET identification du partenaire
    // =======================================================================
    useEffect(() => {
        if (!groupId || !user) return;
        
        // --- LOGIQUE RESTAURÉE : Trouver le vrai partenaire ---
        const findOtherUser = async () => {
            try {
                const groupData = await getGroupData(groupId);
                
                if (groupData && groupData.members && groupData.members.length > 1) {
                    // Trouver l'UID qui n'est PAS moi
                    const partnerId = groupData.members.find(uid => uid !== user.uid);
                    
                    if (partnerId) {
                        setOtherUserId(partnerId);
                        // Chercher son nom
                        const partnerProfile = await getProfileData(partnerId);
                        if (partnerProfile && partnerProfile.name) {
                            setOtherUserName(partnerProfile.name);
                        } else {
                            setOtherUserName("Partenaire"); 
                        }
                    } else {
                        setOtherUserId(null);
                        setOtherUserName("Aucun autre membre");
                    }
                } else {
                    setOtherUserId(null);
                    setOtherUserName("Groupe seul ou invalide");
                }
            } catch (error) {
                console.error("Erreur lecture groupe:", error);
                setOtherUserId(null);
            }
        };

        findOtherUser();
        
        // --- Abonnement au Chat ---
        setLoading(true);
        const unsubscribe = subscribeToMessages(groupId, (newMessages) => {
            setMessages(newMessages);
            setLoading(false);
        });
        
        return () => unsubscribe(); 
        
    }, [groupId, user]);

    // Scroll automatique vers le bas
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // =======================================================================
    // 2. Lancer l'appel
    // =======================================================================
    const handleStartCall = async () => {
        if (!otherUserId) {
            alert("Impossible de trouver le partenaire pour l'appel.");
            return;
        }

        try {
            const callId = await createCall(user.uid, otherUserId);
            // Redirection vers la salle d'appel
            navigate(`/call/${callId}`); 
        } catch (error) {
            console.error("Erreur lancement appel:", error);
            alert("Erreur lors de la création de l'appel. Vérifiez la console.");
        }
    };
    
    // 3. Envoyer un message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            await sendMessage(groupId, user.uid, user.displayName, newMessage.trim());
            setNewMessage("");
        } catch (error) {
            console.error("Erreur envoi message:", error);
        }
    };

    if (loading) return <div className="p-6 text-center">Chargement...</div>;
    if (!groupId) return <div className="p-6 text-center text-red-500">Groupe introuvable.</div>;

    return (
        <div className="flex flex-col h-[80vh] max-w-4xl mx-auto border border-gray-300 rounded-lg shadow-lg bg-white mt-6">
            
            {/* En-tête */}
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b rounded-t-lg">
                <h2 className="text-xl font-bold text-gray-800">Chat avec {otherUserName}</h2>
                <button
                    onClick={handleStartCall}
                    className={`px-4 py-2 rounded-lg text-white font-semibold transition ${
                        otherUserId 
                        ? "bg-green-600 hover:bg-green-700 shadow-md" 
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!otherUserId} 
                >
                    📞 Appel Vidéo
                </button>
            </div>
            
            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-100">
                {messages.map((msg, index) => (
                    <div 
                        key={msg.id || index} 
                        className={`flex ${msg.userId === user.uid ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                            msg.userId === user.uid 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                        }`}>
                            <p className="font-bold text-xs mb-1 opacity-90">{msg.userId === user.uid ? "Moi" : msg.user}</p>
                            <p className="text-sm md:text-base">{msg.text}</p>
                            <span className="text-[10px] opacity-75 mt-1 block text-right">
                                {msg.createdAt ? msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white rounded-b-lg flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50 font-bold transition shadow-md"
                    disabled={loading || !newMessage.trim()}
                >
                    Envoyer
                </button>
            </form>
        </div>
    );
};

export default Chat;