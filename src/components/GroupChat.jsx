import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { uploadChatFile } from "../firebase/services";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc 
} from "firebase/firestore";

const GroupChat = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dummy = useRef();
  const fileInputRef = useRef();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("Discussion");
  
  // Gestion Fichiers & Envoi
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  // Statut du binôme (En ligne / Hors ligne)
  const [buddyStatus, setBuddyStatus] = useState("offline");

  // 1. Infos Groupe + Détection du binôme pour le statut
  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (!groupId) return;
      try {
        const docRef = doc(db, "groups", groupId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGroupName(data.name || "Groupe d'étude");
          
          // --- LOGIQUE STATUT EN LIGNE ---
          // On cherche l'ID de l'autre personne (pas moi)
          if (data.members && data.members.length > 0) {
              const buddyId = data.members.find(id => id !== user.uid);
              
              if (buddyId) {
                  // On écoute le profil de ce buddy en temps réel
                  const unsubBuddy = onSnapshot(doc(db, "users", buddyId), (buddySnap) => {
                      if (buddySnap.exists()) {
                          const buddyData = buddySnap.data();
                          if (buddyData.lastActive) {
                              const lastActiveTime = buddyData.lastActive.toMillis();
                              const now = Date.now();
                              const diffMinutes = (now - lastActiveTime) / 1000 / 60;
                              
                              // Si actif dans les 10 dernières minutes -> En ligne
                              setBuddyStatus(diffMinutes < 10 ? "online" : "offline");
                          }
                      }
                  });
                  // On retourne la fonction de nettoyage pour cet écouteur spécifique
                  return () => unsubBuddy();
              }
          }
          // -------------------------------
        }
      } catch (error) {
          console.error("Erreur récupération groupe:", error);
      }
    };

    // On lance la récupération
    const cleanupBuddyListener = fetchGroupInfo();

    // Marquer comme lu immédiatement
    localStorage.setItem(`lastRead_${groupId}`, Date.now());
    window.dispatchEvent(new Event("storage"));

    // Nettoyage éventuel si fetchGroupInfo retournait quelque chose (ici c'est une promesse, donc géré différemment, mais le useEffect principal nettoie via les dépendances)
  }, [groupId, user]);

  // 2. Écouter les messages (AVEC SÉCURITÉ)
  useEffect(() => {
    if (!groupId) return;

    const q = query(collection(db, "groups", groupId, "messages"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        // SUCCÈS : On a les droits, on charge les messages
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
        setTimeout(() => dummy.current?.scrollIntoView({ behavior: "smooth" }), 100);
        
        // Mise à jour de la lecture locale pour les notifs
        localStorage.setItem(`lastRead_${groupId}`, Date.now());
      },
      (error) => {
        // ERREUR : Permission refusée (Sécurité Firestore)
        console.error("Erreur accès messages :", error);
        alert("⛔ Accès refusé : Vous ne faites pas partie de ce groupe.");
        navigate("/dashboard"); // Redirection de sécurité
      }
    );

    return () => unsubscribe();
  }, [groupId, navigate]);

  // --- GESTION FICHIER ---
  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) { 
              alert("Fichier trop volumineux (Max 5MB)"); 
              return; 
          }
          setSelectedFile(file);
      }
      e.target.value = null; 
  };

  // --- ENVOI MESSAGE ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;
    setIsSending(true);

    try {
        let fileURL = null;
        let type = "text";
        
        // 1. Upload fichier si présent
        if (selectedFile) {
            fileURL = await uploadChatFile(selectedFile, groupId);
            type = selectedFile.type.startsWith("image/") ? "image" : "file";
        }

        // 2. Préparation texte
        let messageText = newMessage.trim();
        if (!messageText && selectedFile) messageText = selectedFile.name;

        // 3. Envoi Firestore
        await addDoc(collection(db, "groups", groupId, "messages"), {
            text: messageText,
            type: type,
            fileURL: fileURL, 
            fileName: selectedFile ? selectedFile.name : null,
            senderId: user.uid,
            senderName: user.displayName || "Anonyme",
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp()
        });

        // 4. Mise à jour infos groupe (pour le tri et les notifs)
        await updateDoc(doc(db, "groups", groupId), {
            lastMessage: messageText,
            lastMessageTime: serverTimestamp(),
            lastSenderId: user.uid
        });

        setNewMessage("");
        setSelectedFile(null);
    } catch (error) {
        console.error("Erreur envoi:", error);
        alert("Erreur lors de l'envoi.");
    } finally {
        setIsSending(false);
    }
  };

  // --- RENDU CONTENU MESSAGE ---
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
                  {msg.text && msg.text !== msg.fileName && (
                      <p className="mt-1 text-sm opacity-90">{msg.text}</p>
                  )}
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
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate max-w-[150px] font-bold text-sm">{msg.fileName || "Fichier"}</span>
                        <span className="text-xs text-gray-500 group-hover:underline">Ouvrir</span>
                      </div>
                  </a>
                   {msg.text && msg.text !== msg.fileName && (
                      <p className="mt-1 text-sm opacity-90">{msg.text}</p>
                  )}
              </div>
          );
      } else {
          return <p className="leading-relaxed">{msg.text}</p>;
      }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Chargement de la discussion...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      
      {/* HEADER AVEC STATUT */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b px-6 z-10">
        <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            💬 {groupName}
            </h2>
            {/* Indicateur de statut */}
            <div className="flex items-center gap-1.5 ml-1 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${buddyStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                <span className="text-xs text-gray-500 font-medium">
                    {buddyStatus === 'online' ? 'Binôme en ligne' : 'Hors ligne'}
                </span>
            </div>
        </div>

        <button 
          onClick={() => navigate(`/call/${groupId}`)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md transition transform active:scale-95"
        >
          <span>📹</span> <span className="hidden sm:inline">Vidéo</span>
        </button>
      </div>

      {/* ZONE MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <div className="text-4xl mb-2">👋</div>
            <p>Dites bonjour à votre binôme !</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[85%] sm:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm">
                   {msg.photoURL ? (
                     <img src={msg.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">
                       {msg.senderName?.charAt(0)}
                     </div>
                   )}
                </div>

                {/* Bulle */}
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

      {/* ZONE DE PRÉVISUALISATION (Fichier sélectionné) */}
      {selectedFile && (
        <div className="bg-gray-200 px-4 py-2 flex justify-between items-center border-t border-gray-300 animate-fade-in">
            <div className="flex items-center gap-2 text-sm text-gray-700 truncate">
                <span className="font-bold text-blue-600">📎 Prêt à envoyer :</span>
                <span className="truncate max-w-xs">{selectedFile.name}</span>
                <span className="text-xs text-gray-500">({(selectedFile.size / 1024).toFixed(0)} ko)</span>
            </div>
            <button 
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-red-600 font-bold p-1 bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
                title="Annuler le fichier"
            >
                ✕
            </button>
        </div>
      )}

      {/* BARRE DE SAISIE */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2 items-center shadow-lg">
        
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
            disabled={isSending || selectedFile}
            className={`p-3 rounded-full transition active:scale-95 ${selectedFile ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`}
            title="Joindre un fichier"
        >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
        </button>

        {/* Input Texte */}
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={selectedFile ? "Ajouter une description..." : "Écrivez votre message..."}
          className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
        
        {/* Bouton Envoyer */}
        <button 
          type="submit" 
          disabled={(!newMessage.trim() && !selectedFile) || isSending} 
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full w-12 h-12 flex items-center justify-center shadow-md transition transform active:scale-95"
        >
          {isSending ? (
               <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default GroupChat;