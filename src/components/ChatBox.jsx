import React, { useState } from "react";

const ChatBox = ({ messages, sendMessage }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim() === "") return;
    sendMessage(text);
    setText("");
  };

  return (
    <div className="border p-3 rounded h-64 flex flex-col justify-between">
      <div className="overflow-y-auto mb-2 flex-1">
        {messages.map((msg, i) => (
          <p key={i}><strong>{msg.user}:</strong> {msg.text}</p>
        ))}
      </div>
      <div className="flex mt-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border p-1 rounded-l"
          placeholder="Tapez un message..."
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 rounded-r"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
