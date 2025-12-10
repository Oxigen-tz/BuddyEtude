import React from "react";
import { useNavigate } from "react-router-dom";

// Ajout d'une prop optionnelle 'onView'
const GroupCard = ({ group }) => {
  const navigate = useNavigate();
  
  // Utilise navigate par défaut pour aller vers la page du groupe
  const handleView = () => {
    navigate(`/group/${group.id}`); 
  };
    
  return (
    <div 
      className="border p-4 rounded-xl shadow hover:shadow-lg transition cursor-pointer flex flex-col justify-between h-full bg-white"
      onClick={handleView}
    >
      <div>
        <h2 className="font-bold text-xl text-buddy-primary mb-2">
            {group.name || "Groupe sans nom"}
        </h2>
        <p className="text-sm text-gray-600">
            <span className="font-medium">Matière :</span> {group.subject}
        </p>
        <p className="text-sm text-gray-600">
            <span className="font-medium">Niveau :</span> {group.level}
        </p>
        <p className="text-sm text-gray-600">
            <span className="font-medium">Membres :</span> {group.members?.length || 0}
        </p>
      </div>

      {/* Bouton d'action clair */}
      <button 
        onClick={(e) => { e.stopPropagation(); handleView(); }}
        className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition"
      >
        Voir le Groupe
      </button>
    </div>
  );
};

export default GroupCard;