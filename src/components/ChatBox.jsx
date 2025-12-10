import React, { useState, useRef, useEffect } from "react";

// NOTE: Le composant parent devra fournir le UID de l'utilisateur courant (currentUserUid) 
// et s'assurer que les objets messages ont un ID unique et un champ userId.
const ChatBox = ({ messages, sendMessage, currentUserUid }) => {
  const [text, setText] = useState("");
  // Réf pour cibler le conteneur des messages et gérer le défilement
  const messagesEndRef = useRef(null);

  // Défilement automatique vers le bas lors de la réception de nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (text.trim() === "") return;
    sendMessage(text);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Empêche le saut de ligne dans certains contextes
      handleSend();
    }
  };

  return (
    <div className="border border-gray-300 p-4 rounded-lg h-96 flex flex-col justify-between bg-white">
      {/* Conteneur des messages avec défilement */}
      <div className="overflow-y-auto mb-3 flex-1 space-y-2">
        {messages.map((msg) => {
          // Détermine si le message vient de l'utilisateur courant
          const isUser = msg.userId === currentUserUid;

          return (
            // Utilisation de msg.id pour une clé stable
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-xs px-4 py-2 rounded-xl text-sm 
                  ${isUser 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`
                }
              >
                {/* Affichage optionnel du nom si ce n'est pas l'utilisateur courant */}
                {!isUser && <strong className="block text-xs opacity-80">{msg.user}:</strong>}
                {msg.text}
                <span className="block text-xs mt-1 opacity-60">
                  {msg.createdAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Maintenant'}
                </span>
              </div>
            </div>
          );
        })}
        {/* Ancre pour le défilement automatique */}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="flex">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown} // Gestion de la touche Entrée
          className="flex-1 border border-gray-300 p-2 rounded-l-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tapez un message..."
          disabled={!currentUserUid}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-r-lg disabled:opacity-50"
          disabled={text.trim() === "" || !currentUserUid}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
};

export default ChatBox;