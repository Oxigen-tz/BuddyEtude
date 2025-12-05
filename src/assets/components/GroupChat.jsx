import React, { useEffect, useState } from "react";
import ChatBox from "./ChatBox";
import { subscribeToMessages, sendMessage } from "../firebase/chat";
import { useAuth } from "../context/AuthContext";

/**
 * Chat temps réel pour un groupe
 * @param {string} groupId - ID du groupe
 */
const GroupChat = ({ groupId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(groupId, setMessages);
    return () => unsubscribe();
  }, [groupId]);

  const handleSendMessage = (text) => {
    if (!user) return;
    sendMessage(groupId, user.displayName || "Anonyme", text);
  };

  return <ChatBox messages={messages} sendMessage={handleSendMessage} />;
};

export default GroupChat;
