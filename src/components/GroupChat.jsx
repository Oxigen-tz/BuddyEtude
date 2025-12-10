import React, { useEffect, useState } from "react";
import ChatBox from "./ChatBox";
// NOTE: Assurez-vous d'implémenter sendMessage et subscribeToMessages pour gérer l'UID dans firebase/chat
import { subscribeToMessages, sendMessage } from "../firebase/chat";
import { useAuth } from "../context/AuthContext";

/**
 * Chat temps réel pour un groupe
 * @param {string} groupId - ID du groupe
 */
const GroupChat = ({ groupId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true); // État de chargement
  const [error, setError] = useState(null);     // État d'erreur

  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
    setError(null);

    try {
      // S'abonne aux messages pour ce groupe
      const unsubscribe = subscribeToMessages(groupId, (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      });

      // Fonction de nettoyage (très bien conservée)
      return () => unsubscribe();
    } catch (e) {
      setError("Erreur de connexion au chat.");
      setLoading(false);
      console.error("Erreur de souscription au chat:", e);
    }
  }, [groupId]);

  const handleSendMessage = (text) => {
    if (!user) return;
    
    // Envoie l'UID de l'utilisateur pour un stockage sécurisé dans Firestore
    sendMessage(groupId, user.uid, user.displayName || "Anonyme", text)
      .catch(e => {
        setError("Impossible d'envoyer le message.");
        console.error("Erreur d'envoi:", e);
      });
  };
  
  if (error) return <p className="text-red-500 p-6">Erreur: {error}</p>;
  if (loading) return <p className="p-6">Chargement des messages...</p>;
  if (!user) return <p className="p-6">Veuillez vous connecter pour participer au chat.</p>;

  return (
    <ChatBox 
      messages={messages} 
      sendMessage={handleSendMessage} 
      currentUserUid={user.uid} // Passer l'UID pour l'alignement des messages
    />
  );
};

export default GroupChat;