import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { uploadChatFile } from "../firebase/services";
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc 
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
  const [buddyStatus, setBuddyStatus] = useState("offline");
  
  // 🟢 NOUVEAU : État pour savoir si un appel est en cours
  const [isCallActive, setIsCallActive] = useState(false);

  // 1. Infos Groupe (Nom + Statut Appel + Statut Binôme)
  useEffect(() => {
    if (!groupId) return;

    // On écoute le document du GROUPE en temps réel (pour voir le changement isCallActive direct)
    const unsubGroup = onSnapshot(doc(db, "groups", groupId), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setGroupName(data.name || "Groupe d'étude");
            setIsCallActive(data.isCallActive === true); // 👈 On récupère l'état de l'appel

            // --- Logique Buddy En Ligne ---
            if (data.members && data.members.length > 0) {
                const buddyId = data.members.find(id => id !== user.uid);
                if (buddyId) {
                    // Petite astuce : on ne crée l'écouteur du buddy qu'une fois pour éviter les boucles
                    // Dans un vrai projet on séparerait ça, mais ici on laisse le useEffect gérer
                }
            }
        }
    });

    // Marquer comme lu
    localStorage.setItem(`lastRead_${groupId}`, Date.now());
    window.dispatchEvent(new Event("storage"));

    return () => unsubGroup();
  }, [groupId, user]);

  // 2. Écoute messages (Inchangé)
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, "groups", groupId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
        setTimeout(() => dummy.current?.scrollIntoView({ behavior: "smooth" }), 100);
        localStorage.setItem(`lastRead_${groupId}`, Date.now());
    }, (error) => {
        navigate("/dashboard");
    });
    return () => unsubscribe();
  }, [groupId, navigate]);

  // Gestion Envoi (Inchangé)
  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file && file.size <= 5*1024*1024) setSelectedFile(file);
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
            senderId: user.uid, senderName: user.displayName, photoURL: user.photoURL, createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, "groups", groupId), {
            lastMessage: txt, lastMessageTime: serverTimestamp(), lastSenderId: user.uid
        });
        setNewMessage(""); setSelectedFile(null);
    } catch (err) { console.error(err); } finally { setIsSending(false); }
  };

  const renderMessageContent = (msg) => {
      if (msg.type === "image") return <div className="mt-2"><img src={msg.fileURL} className="max-w-[200px] rounded-lg border cursor-pointer" onClick={() => window.open(msg.fileURL)} /></div>;
      if (msg.type === "file") return <div className="mt-2"><a href={msg.fileURL} target="_blank" className="bg-gray-50 p-2 rounded text-blue-600 font-bold flex gap-2">📄 {msg.fileName}</a></div>;
      return <p>{msg.text}</p>;
  };

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      
      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b px-6 z-10">
        <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-800">💬 {groupName}</h2>
            {/* Si un appel est en cours, on affiche un texte vert, sinon le statut du binôme */}
            {isCallActive ? (
                <span className="text-xs text-green-600 font-bold animate-pulse flex items-center gap-1">
                    🔴 Appel en cours...
                </span>
            ) : (
                <div className="flex items-center gap-1.5 ml-1 mt-0.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${buddyStatus === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className="text-xs text-gray-500 font-medium">{buddyStatus === 'online' ? 'En ligne' : 'Hors ligne'}</span>
                </div>
            )}
        </div>

        {/* BOUTON DYNAMIQUE */}
        {isCallActive ? (
            // BOUTON VERT CLIGNOTANT (REJOINDRE)
            <button 
                onClick={() => navigate(`/call/${groupId}`)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg animate-bounce-slow border-2 border-green-400"
            >
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-200 opacity-75 right-2 top-2"></span>
                📞 Rejoindre l'appel
            </button>
        ) : (
            // BOUTON VIOLET NORMAL (LANCER)
            <button 
                onClick={() => navigate(`/call/${groupId}`)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md transition"
            >
                📹 Vidéo
            </button>
        )}
      </div>

      {/* MESSAGES (Inchangé) */}
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

      {/* INPUT (Inchangé) */}
      {selectedFile && <div className="bg-gray-200 px-4 py-2 flex justify-between items-center text-sm font-bold text-blue-600">📎 {selectedFile.name} <button onClick={() => setSelectedFile(null)}>✕</button></div>}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2 items-center shadow-lg">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current.click()} disabled={isSending} className="p-3 text-gray-500 hover:bg-gray-100 rounded-full">📎</button>
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Message..." className="flex-1 p-3 border rounded-full outline-none focus:ring-1 focus:ring-blue-500" />
        <button type="submit" disabled={!newMessage.trim() && !selectedFile} className="bg-blue-600 text-white p-3 rounded-full w-12 h-12 shadow hover:bg-blue-700">➤</button>
      </form>
    </div>
  );
};

export default GroupChat;