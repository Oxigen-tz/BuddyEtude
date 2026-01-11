import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc 
} from "firebase/firestore";

const GroupChat = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dummy = useRef(); // Pour le scroll automatique

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("Discussion");

  // 1. Charger les infos du groupe (pour le titre)
  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (groupId) {
        try {
          const docRef = doc(db, "groups", groupId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setGroupName(docSnap.data().name || "Groupe d'étude");
          }
        } catch (error) {
          console.error("Erreur chargement groupe:", error);
        }
      }
    };
    fetchGroupInfo();
  }, [groupId]);

  // 2. Écouter les messages en temps réel
  useEffect(() => {
    if (!groupId) return;

    // Référence vers la sous-collection "messages" du groupe
    const messagesRef = collection(db, "groups", groupId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setLoading(false);
      
      // Scroll vers le bas à chaque nouveau message
      setTimeout(() => {
        dummy.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, (error) => {
      console.error("Erreur lecture messages:", error);
      setLoading(false); // Arrêter le chargement même en cas d'erreur
    });

    return () => unsubscribe();
  }, [groupId]);

  // 3. Envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, "groups", groupId, "messages"), {
        text: newMessage,
        senderId: user.uid,
        senderName: user.displayName || "Anonyme",
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Erreur envoi:", error);
      alert("Impossible d'envoyer le message.");
    }
  };

  // 4. Lancer un appel vidéo
  const startVideoCall = () => {
    // On utilise l'ID du groupe comme ID de salle pour que tout le monde se retrouve
    navigate(`/call/${groupId}`);
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Chargement des messages...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      
      {/* En-tête du Chat */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b px-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          💬 {groupName}
        </h2>
        
        <button 
          onClick={startVideoCall}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-md"
        >
          📹 Appel Vidéo
        </button>
      </div>

      {/* Zone des Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <p>Aucun message pour l'instant.</p>
            <p className="text-sm">Lancez la discussion ! 👋</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                   {msg.photoURL ? (
                     <img src={msg.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">
                       {msg.senderName?.charAt(0)}
                     </div>
                   )}
                </div>

                {/* Bulle de message */}
                <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${
                  isMe 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                }`}>
                  {!isMe && <p className="text-xs text-gray-500 font-bold mb-1">{msg.senderName}</p>}
                  <p>{msg.text}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={dummy}></div>
      </div>

      {/* Barre de saisie */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-full w-12 h-12 flex items-center justify-center transition shadow-md"
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default GroupChat;