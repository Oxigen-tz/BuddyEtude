import React from "react";
import { useNavigate } from "react-router-dom";

const GroupCard = ({ group }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <h3 className="text-lg font-bold text-buddy-primary mb-1">
        {group.name || "Groupe sans nom"}
      </h3>
      
      <div className="text-sm text-gray-600 space-y-1 mb-4">
        {group.subject && <p>📚 Matière : {group.subject}</p>}
        {group.level && <p>📊 Niveau : {group.level}</p>}
        <p>👥 Membres : {group.members ? group.members.length : 0}</p>
      </div>

      <button
        onClick={() => navigate(`/chat/${group.id}`)}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition"
      >
        Voir le Groupe
      </button>
    </div>
  );
};

export default GroupCard;