import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { uploadChatFile } from "../firebase/services"; // Import de la nouvelle fonction
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
  const dummy = useRef();
  const fileInputRef = useRef(); // Référence pour le clic caché

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("Discussion");
  const [isUploading, setIsUploading] = useState(false); // État chargement fichier

  // 1. Charger les infos du groupe
  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (groupId) {
        const docSnap = await getDoc(doc(db, "groups", groupId));
        if (docSnap.exists()) {
          setGroupName(docSnap.data().name || "Groupe d'étude");
        }
      }
    };
    fetchGroupInfo();
  }, [groupId]);

  // 2. Écouter les messages
  useEffect(() => {
    if (!groupId) return;

    const messagesRef = collection(db, "groups", groupId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setLoading(false);
      
      // Scroll auto vers le bas
      setTimeout(() => {
        dummy.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [groupId]);

  // 3. Envoyer un message TEXTE
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessageToFireStore({ text: newMessage, type: "text" });
    setNewMessage("");
  };

  // 4. Envoyer un FICHIER
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limite de taille simple (ex: 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("Fichier trop volumineux (Max 5MB)");
        return;
    }

    setIsUploading(true);
    try {
        // Upload vers Storage
        const url = await uploadChatFile(file, groupId);
        
        // Déterminer si c'est une image
        const type = file.type.startsWith("image/") ? "image" : "file";
        
        // Enregistrer dans Firestore
        await sendMessageToFireStore({ 
            text: file.name, 
            type: type,
            fileURL: url 
        });

    } catch (error) {
        console.error(error);
        alert("Erreur lors de l'envoi du fichier.");
    } finally {
        setIsUploading(false);
        e.target.value = null; // Reset input
    }
  };

  // Fonction utilitaire d'envoi
  const sendMessageToFireStore = async (data) => {
    try {
        await addDoc(collection(db, "groups", groupId, "messages"), {
            ...data,
            senderId: user.uid,
            senderName: user.displayName || "Anonyme",
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Erreur envoi message:", error);
    }
  };

  // 5. Affichage intelligent du contenu
  const renderMessageContent = (msg) => {
      if (msg.type === "image") {
          return (
              <div className="mt-2">
                  <img 
                    src={msg.fileURL} 
                    alt="Envoyé" 
                    className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 object-cover" 
                    onClick={() => window.open(msg.fileURL, "_blank")} 
                  />
              </div>
          );
      } else if (msg.type === "file") {
          return (
              <div className="mt-2">
                  <a 
                    href={msg.fileURL} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2 rounded-lg hover:bg-gray-100 transition text-blue-600 group"
                  >
                      <span className="text-xl">📄</span> 
                      <span className="truncate max-w-[150px] underline decoration-blue-300 group-hover:decoration-blue-600 font-medium">
                        {msg.text}
                      </span>
                  </a>
              </div>
          );
      } else {
          // Texte normal
          return <p className="leading-relaxed">{msg.text}</p>;
      }
  };


  if (loading) return <div className="p-10 text-center text-gray-500">Chargement des messages...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      
      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b px-6 z-10">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          💬 {groupName}
        </h2>
        <button 
          onClick={() => navigate(`/call/${groupId}`)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-md"
        >
          <span>📹</span> <span className="hidden sm:inline">Vidéo</span>
        </button>
      </div>

      {/* ZONE MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <div className="text-4xl mb-2">👋</div>
            <p>Aucun message. Lancez la discussion !</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[85%] sm:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0 border border-gray-200">
                   {msg.photoURL ? (
                     <img src={msg.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">
                       {msg.senderName?.charAt(0)}
                     </div>
                   )}
                </div>

                {/* Bulle Message */}
                <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${
                  isMe 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                }`}>
                  {!isMe && <p className="text-xs text-gray-500 font-bold mb-1 opacity-80">{msg.senderName}</p>}
                  
                  {renderMessageContent(msg)}
                  
                </div>
              </div>
            </div>
          );
        })}
        <div ref={dummy}></div>
      </div>

      {/* BARRE DE SAISIE */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2 items-center shadow-lg">
        
        {/* Input File Caché */}
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
        />
        
        {/* Bouton Trombone */}
        <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            className="text-gray-500 hover:text-blue-600 p-3 rounded-full hover:bg-blue-50 transition active:scale-95"
            title="Envoyer un fichier ou une image"
        >
            {isUploading ? (
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
            )}
        </button>

        {/* Champ Texte */}
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
        
        {/* Bouton Envoyer */}
        <button 
          type="submit" 
          disabled={!newMessage.trim()} 
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full w-12 h-12 flex items-center justify-center shadow-md transition transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default GroupChat;