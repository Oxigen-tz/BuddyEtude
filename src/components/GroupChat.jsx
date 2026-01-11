import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { uploadChatFile } from "../firebase/services";
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, getDocs 
} from "firebase/firestore";

const GroupChat = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Refs
  const dummy = useRef();
  const fileInputRef = useRef();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  
  // Ref pour stocker le trait en cours avant envoi
  const currentPathRef = useRef([]); 

  // --- États Chat & Messages ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("Discussion");
  
  // --- États Gestion Fichiers ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  // --- NOUVEAUX ÉTATS (Menu + & Tableau Blanc) ---
  const [showMenu, setShowMenu] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // 1. Infos Groupe & Messages
  useEffect(() => {
    if (!groupId) return;

    // Écoute du groupe
    const unsubGroup = onSnapshot(doc(db, "groups", groupId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGroupName(data.name || "Discussion");
        setIsCallActive(data.isCallActive || false);
      }
    });

    // Écoute des messages
    const q = query(collection(db, "groups", groupId, "messages"), orderBy("createdAt"));
    const unsubMsg = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      dummy.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => {
      unsubGroup();
      unsubMsg();
    };
  }, [groupId]);

  // 2. Setup Tableau Blanc & Écoute des dessins (Temps Réel)
  useEffect(() => {
    if (showWhiteboard && canvasRef.current) {
      const canvas = canvasRef.current;
      // Ajuster à la taille du conteneur parent
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctxRef.current = ctx;

      // ÉCOUTER LES DESSINS DES AUTRES
      const qDrawings = query(collection(db, "groups", groupId, "whiteboard"), orderBy("createdAt"));
      
      const unsubDraw = onSnapshot(qDrawings, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            // Ne pas redessiner ce que je viens de dessiner moi-même (éviter doublons)
            if (data.senderId !== user.uid) {
              drawPathOnCanvas(data.path, data.color);
            }
          }
          // Si on reçoit un ordre d'effacement (type: clear)
          if (change.type === "added" && change.doc.data().type === "clear") {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        });
      });

      return () => unsubDraw();
    }
  }, [showWhiteboard, groupId, user.uid]);

  // Fonction utilitaire pour dessiner un chemin complet reçu de la base de données
  const drawPathOnCanvas = (path, color) => {
    if (!ctxRef.current || !path || path.length < 1) return;
    
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.strokeStyle = color || "black";
    ctx.lineWidth = 3;
    
    // On se place au premier point
    ctx.moveTo(path[0].x, path[0].y);
    
    // On relie tous les points suivants
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    ctx.closePath();
  };

  // --- Fonctions Chat ---
  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setShowMenu(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || isSending) return;

    setIsSending(true);
    try {
      let fileURL = null;
      let fileType = null;

      if (selectedFile) {
        fileURL = await uploadChatFile(selectedFile, groupId);
        fileType = selectedFile.type.startsWith("image/") ? "image" : "file";
      }

      await addDoc(collection(db, "groups", groupId, "messages"), {
        text: newMessage,
        senderId: user.uid,
        senderName: user.displayName || "Anonyme",
        createdAt: serverTimestamp(),
        fileURL,
        fileType,
        fileName: selectedFile ? selectedFile.name : null
      });

      setNewMessage("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Erreur envoi:", error);
    } finally {
      setIsSending(false);
    }
  };

  // --- Fonctions Tableau Blanc (Dessin Local + Envoi) ---
  
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    
    // On commence un nouveau chemin en mémoire
    currentPathRef.current = [{ x: offsetX, y: offsetY }];
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    
    // Dessin local (pour que ce soit fluide pour l'utilisateur)
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
    
    // Ajout du point au chemin en mémoire
    currentPathRef.current.push({ x: offsetX, y: offsetY });
  };

  const stopDrawing = async () => {
    if (!isDrawing) return;
    ctxRef.current.closePath();
    setIsDrawing(false);

    // ENVOYER LE TRAIT COMPLET À FIREBASE
    if (currentPathRef.current.length > 0) {
      try {
        await addDoc(collection(db, "groups", groupId, "whiteboard"), {
          type: "path",
          path: currentPathRef.current, // Tableau de coordonnées
          color: "black",
          senderId: user.uid,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Erreur save drawing:", error);
      }
    }
    currentPathRef.current = []; // Reset
  };

  const handleClearCanvas = async () => {
    // 1. Effacer localement
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // 2. Envoyer signal aux autres
    try {
        await addDoc(collection(db, "groups", groupId, "whiteboard"), {
            type: "clear",
            senderId: user.uid,
            createdAt: serverTimestamp()
        });
    } catch (e) { console.error(e); }

    // Optionnel : Supprimer les docs de la DB pour nettoyer (maintenance)
    // Ici on envoie juste un signal "effacer" pour faire simple
  };

  const getCoordinates = (event) => {
    if (event.touches && event.touches.length > 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top
      };
    }
    return { offsetX: event.offsetX, offsetY: event.offsetY };
  };

  const renderMessageContent = (msg) => {
    return (
      <div className="flex flex-col gap-1">
        {msg.fileURL && msg.fileType === "image" && (
          <img src={msg.fileURL} alt="attachment" className="max-w-[200px] rounded-lg mb-1 border" />
        )}
        {msg.fileURL && msg.fileType === "file" && (
          <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-100 underline text-sm mb-1 bg-black/20 p-2 rounded">
            📄 {msg.fileName || "Fichier joint"}
          </a>
        )}
        {msg.text && <p>{msg.text}</p>}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 relative">
      
      {/* HEADER */}
      <div className="p-4 bg-white shadow-sm border-b flex justify-between items-center z-10">
        <div>
          <h2 className="font-bold text-lg text-gray-800">{groupName}</h2>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isCallActive ? "bg-red-500 animate-pulse" : "bg-green-500"}`}></span>
            <span className="text-xs text-gray-500">{isCallActive ? "Appel en cours..." : "Discussion active"}</span>
          </div>
        </div>
        <button onClick={() => navigate(`/call/${groupId}`)} className={`p-2 rounded-full transition ${isCallActive ? "bg-green-500 text-white animate-bounce" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
          📹
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? <p className="text-center text-gray-400">Chargement...</p> : messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 border rounded-bl-none"}`}>
                  {!isMe && <p className="text-xs text-gray-500 font-bold mb-1">{msg.senderName}</p>}
                  {renderMessageContent(msg)}
                </div>
                <span className="text-[10px] text-gray-400 mt-1">
                  {msg.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={dummy}></div>
      </div>

      {/* INPUT & MENU */}
      <div className="p-3 bg-white border-t relative shadow-lg">
        {selectedFile && (
          <div className="absolute bottom-full left-0 w-full bg-gray-100 px-4 py-2 flex justify-between items-center text-sm font-bold text-blue-600 border-t">
            <span>📎 {selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {showMenu && (
          <div className="absolute bottom-20 left-4 bg-white border border-gray-200 shadow-xl rounded-xl w-48 overflow-hidden animate-fade-in z-20">
            <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition" onClick={() => fileInputRef.current.click()}>
              <span>📂</span> <span className="text-sm font-medium text-gray-700">Importer fichier</span>
            </div>
            <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition border-t" onClick={() => { setShowWhiteboard(true); setShowMenu(false); }}>
              <span>✏️</span> <span className="text-sm font-medium text-gray-700">Tableau Blanc</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <button type="button" onClick={() => setShowMenu(!showMenu)} className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all duration-200 ${showMenu ? "bg-gray-800 text-white rotate-45" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>+</button>
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Votre message..." className="flex-1 p-3 border border-gray-300 rounded-full outline-none focus:ring-2 focus:ring-blue-500 transition" disabled={isSending} />
          <button type=\"submit\" disabled={isSending || (!newMessage.trim() && !selectedFile)} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition shadow-md">
            <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </form>
      </div>

      {/* --- MODAL TABLEAU BLANC COLLABORATIF --- */}
      {showWhiteboard && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✏️</span>
                <h3 className="font-bold text-gray-800 text-lg">Tableau Blanc (En direct)</h3>
              </div>
              <div className="flex gap-3">
                <button onClick={handleClearCanvas} className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition">
                  Effacer
                </button>
                <button onClick={() => setShowWhiteboard(false)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition shadow-sm">
                  Fermer
                </button>
              </div>
            </div>
            <div className="flex-1 relative bg-white cursor-crosshair touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                className="w-full h-full block"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-100/90 px-4 py-1 rounded-full text-xs text-gray-500 shadow-sm pointer-events-none border">
                Les dessins apparaissent chez les autres une fois le trait terminé.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChat;