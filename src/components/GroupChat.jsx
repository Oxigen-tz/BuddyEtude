import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { uploadChatFile } from "../firebase/services";
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc 
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  // 🟢 NOUVEAU : Statut du binôme
  const [buddyStatus, setBuddyStatus] = useState("offline"); // 'online' | 'offline'

  // 1. Infos Groupe + Détection du binôme pour le statut
  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (!groupId) return;
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
                return () => unsubBuddy(); // Nettoyage
            }
        }
        // -------------------------------
      }
    };

    fetchGroupInfo();
    
    // Marquer comme lu
    localStorage.setItem(`lastRead_${groupId}`, Date.now());
    window.dispatchEvent(new Event("storage"));
  }, [groupId, user]);

  // 2. Écouter les messages (Inchangé)
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, "groups", groupId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      setTimeout(() => dummy.current?.scrollIntoView({ behavior: "smooth" }), 100);
      localStorage.setItem(`lastRead_${groupId}`, Date.now());
    });
    return () => unsubscribe();
  }, [groupId]);

  // Fonctions d'envoi (Inchangées - version raccourcie ici pour lisibilité mais garde ton code complet)
  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file && file.size <= 5*1024*1024) setSelectedFile(file);
      else if(file) alert("Fichier trop lourd");
      e.target.value = null;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;
    setIsSending(true);
    try {
        let fileURL = null, type = "text";
        if (selectedFile) {
            fileURL = await uploadChatFile(selectedFile, groupId);
            type = selectedFile.type.startsWith("image/") ? "image" : "file";
        }
        let txt = newMessage.trim();
        if(!txt && selectedFile) txt = selectedFile.name;

        await addDoc(collection(db, "groups", groupId, "messages"), {
            text: txt, type, fileURL, fileName: selectedFile?.name || null,
            senderId: user.uid, senderName: user.displayName || "Moi", photoURL: user.photoURL,
            createdAt: serverTimestamp()
        });
        
        await updateDoc(doc(db, "groups", groupId), {
            lastMessage: txt, lastMessageTime: serverTimestamp(), lastSenderId: user.uid
        });
        setNewMessage(""); setSelectedFile(null);
    } catch (err) { console.error(err); } finally { setIsSending(false); }
  };

  const renderMessageContent = (msg) => {
      if (msg.type === "image") return <div className="mt-2"><img src={msg.fileURL} className="max-w-[200px] rounded-lg border cursor-pointer" onClick={() => window.open(msg.fileURL)} />{msg.text !== msg.fileName && <p className="mt-1 opacity-90">{msg.text}</p>}</div>;
      if (msg.type === "file") return <div className="mt-2"><a href={msg.fileURL} target="_blank" className="flex items-center gap-2 bg-gray-50 p-2 rounded text-blue-600 font-bold">📄 {msg.fileName}</a></div>;
      return <p>{msg.text}</p>;
  };

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      
      {/* HEADER AVEC STATUT */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b px-6 z-10">
        <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            💬 {groupName}
            </h2>
            {/* PASTILLE STATUT */}
            <div className="flex items-center gap-1.5 ml-1 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${buddyStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                <span className="text-xs text-gray-500 font-medium">
                    {buddyStatus === 'online' ? 'Binôme en ligne' : 'Hors ligne'}
                </span>
            </div>
        </div>

        <button onClick={() => navigate(`/call/${groupId}`)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md transition">
          📹 Vidéo
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[85%] sm:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0 border border-gray-200">
                   {msg.photoURL ? <img src={msg.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xs">{msg.senderName?.charAt(0)}</div>}
                </div>
                <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 border rounded-bl-none"}`}>
                  {!isMe && <p className="text-xs text-gray-500 font-bold mb-1 opacity-80">{msg.senderName}</p>}
                  {renderMessageContent(msg)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={dummy}></div>
      </div>

      {/* INPUT ZONE (Avec Preview Fichier) */}
      {selectedFile && (
        <div className="bg-gray-200 px-4 py-2 flex justify-between items-center border-t border-gray-300">
            <span className="truncate max-w-xs font-bold text-blue-600 text-sm">📎 {selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-red-600 font-bold px-2">✕</button>
        </div>
      )}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2 items-center shadow-lg">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current.click()} disabled={isSending} className={`p-3 rounded-full transition ${selectedFile ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>📎</button>
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={selectedFile ? "Description..." : "Message..."} className="flex-1 p-3 border rounded-full focus:ring-1 focus:ring-blue-500 outline-none" />
        <button type="submit" disabled={(!newMessage.trim() && !selectedFile) || isSending} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full w-12 h-12 shadow-md flex items-center justify-center disabled:opacity-50">➤</button>
      </form>
    </div>
  );
};

export default GroupChat;