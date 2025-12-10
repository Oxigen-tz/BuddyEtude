import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// 🟢 Importez les fonctions de chat (ajustez le chemin si nécessaire)
import { sendMessage, subscribeToMessages } from "../firebase/chat"; 

const Chat = () => {
    // Récupère l'ID du groupe depuis l'URL (ex: /chat/groupe-abc)
    const { groupId } = useParams(); 
    const { user } = useAuth();
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null); // Pour faire défiler automatiquement

    // =======================================================================
    // 1. Abonnement aux messages en temps réel (onSnapshot)
    // =======================================================================
    useEffect(() => {
        if (!groupId || !user) return; 

        setLoading(true);
        
        // 🟢 Démarre l'écoute en temps réel et reçoit la fonction de désabonnement
        const unsubscribe = subscribeToMessages(groupId, (newMessages) => {
            setMessages(newMessages);
            setLoading(false);
        });

        // Fonction de nettoyage: Arrête l'écoute lorsque le composant est démonté
        return () => unsubscribe(); 
    }, [groupId, user]);


    // Fait défiler jusqu'au bas du chat chaque fois que les messages changent
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    // =======================================================================
    // 2. Fonction d'envoi de message
    // =======================================================================
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            await sendMessage(groupId, user.uid, user.displayName, newMessage.trim());
            setNewMessage(""); // Vide le champ après l'envoi
        } catch (error) {
            console.error("Erreur lors de l'envoi du message:", error);
            // Afficher une alerte utilisateur ici si nécessaire
        }
    };
    
    // =======================================================================
    // Rendu
    // =======================================================================

    if (loading) return <div className="p-6 text-center">Chargement des messages...</div>;
    if (!groupId) return <div className="p-6 text-center text-red-500">Aucun groupe de discussion sélectionné.</div>;

    return (
        <div className="flex flex-col h-[80vh] max-w-4xl mx-auto border border-gray-300 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold p-4 bg-gray-100 border-b">Chat de Groupe: {groupId}</h2>
            
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
                <div ref={messagesEndRef} /> {/* Point d'ancrage pour le scroll */}
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