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
  updateDoc // <--- IMPORTANT : On ajoute updateDoc
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

  // 1. Charger les infos du groupe & Marquer comme LU
  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (groupId) {
        const docSnap = await getDoc(doc(db, "groups", groupId));
        if (docSnap.exists()) {
          setGroupName(docSnap.data().name || "Groupe d'étude");
        }
        
        // 🔔 SYSTEME DE NOTIF : On enregistre que l'utilisateur a vu ce groupe maintenant
        localStorage.setItem(`lastRead_${groupId}`, Date.now());
        // On déclenche un événement pour que le Header se mette à jour tout de suite
        window.dispatchEvent(new Event("storage"));
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
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setLoading(false);
      
      // Scroll auto
      setTimeout(() => {
        dummy.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // 🔔 À chaque nouveau message qui arrive, on met à jour le "Vu" si on est sur la page
      localStorage.setItem(`lastRead_${groupId}`, Date.now());
    });

    return () => unsubscribe();
  }, [groupId]);

  // --- GESTION FICHIER ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { alert("Max 5MB"); return; }
        setSelectedFile(file);
    }
    e.target.value = null; 
  };
  const clearSelectedFile = () => setSelectedFile(null);

  // --- ENVOI MESSAGE ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;
    setIsSending(true);

    try {
        let fileURL = null;
        let type = "text";
        if (selectedFile) {
            fileURL = await uploadChatFile(selectedFile, groupId);
            type = selectedFile.type.startsWith("image/") ? "image" : "file";
        }

        let messageText = newMessage.trim();
        if (!messageText && selectedFile) messageText = selectedFile.name;

        // 1. Ajouter le message
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

        // 2. 🔔 METTRE À JOUR LE GROUPE (Pour la notif des autres)
        const groupRef = doc(db, "groups", groupId);
        await updateDoc(groupRef, {
            lastMessage: messageText,
            lastMessageTime: serverTimestamp(),
            lastSenderId: user.uid // Pour ne pas se notifier soi-même
        });

        setNewMessage("");
        setSelectedFile(null);
    } catch (error) {
        console.error("Erreur envoi:", error);
    } finally {
        setIsSending(false);
    }
  };

  // --- RENDU CONTENU ---
  const renderMessageContent = (msg) => {
      if (msg.type === "image") {
          return (
              <div className="mt-2">
                  <img src={msg.fileURL} alt="img" className="max-w-[200px] rounded-lg border cursor-pointer" onClick={() => window.open(msg.fileURL, "_blank")} />
                  {msg.text !== msg.fileName && <p className="mt-1 text-sm opacity-90">{msg.text}</p>}
              </div>
          );
      } else if (msg.type === "file") {
          return (
              <div className="mt-2">
                  <a href={msg.fileURL} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg text-blue-600 underline">
                      📄 <span className="truncate max-w-[150px] font-bold text-sm">{msg.fileName}</span>
                  </a>
                  {msg.text !== msg.fileName && <p className="mt-1 text-sm opacity-90">{msg.text}</p>}
              </div>
          );
      } else {
          return <p>{msg.text}</p>;
      }
  };

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b px-6 z-10">
        <h2 className="text-xl font-bold text-gray-800">💬 {groupName}</h2>
        <button onClick={() => navigate(`/call/${groupId}`)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-purple-700">
          📹 Vidéo
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                   {msg.photoURL ? <img src={msg.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xs">{msg.senderName?.charAt(0)}</div>}
                </div>
                <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 border rounded-bl-none"}`}>
                  {!isMe && <p className="text-xs text-gray-500 font-bold mb-1">{msg.senderName}</p>}
                  {renderMessageContent(msg)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={dummy}></div>
      </div>

      {/* PREVIEW */}
      {selectedFile && (
        <div className="bg-gray-200 px-4 py-2 flex justify-between items-center text-sm">
            <span className="truncate max-w-xs font-bold text-blue-600">📎 {selectedFile.name}</span>
            <button onClick={clearSelectedFile} className="font-bold text-gray-500 hover:text-red-600">✕</button>
        </div>
      )}

      {/* INPUT */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2 items-center shadow-lg">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current.click()} disabled={isSending} className={`p-3 rounded-full ${selectedFile ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>📎</button>
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Message..." className="flex-1 p-3 border rounded-full focus:ring-1 focus:ring-blue-500 outline-none" />
        <button type="submit" disabled={(!newMessage.trim() && !selectedFile) || isSending} className="bg-blue-600 text-white p-3 rounded-full w-12 h-12 shadow-md hover:bg-blue-700 disabled:opacity-50">➤</button>
      </form>
    </div>
  );
};

export default GroupChat;