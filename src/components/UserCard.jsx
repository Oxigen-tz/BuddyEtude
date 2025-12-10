import React from "react";

// Ajout d'une prop onClick pour l'action de contact (Video Call / Chat)
const UserCard = ({ user, onClickContact }) => {

  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <div 
      className="border p-4 rounded-xl shadow hover:shadow-lg transition bg-white flex flex-col justify-between h-full"
    >
      <div className="flex items-center mb-3">
        {/* Avatar/Initiales */}
        <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 font-bold text-lg mr-3">
          {/* Supposons que user.photoURL est disponible après l'authentification Google */}
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            initial
          )}
        </div>
        
        {/* Informations de base */}
        <div>
          <h3 className="font-bold text-lg">{user.name || "Utilisateur Inconnu"}</h3>
          <p className="text-sm text-gray-500">{user.level}</p>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        {/* Affichage des compétences (matières) */}
        <p>
            <span className="font-medium">Matières :</span> 
            {user.skills && user.skills.length > 0 
                ? user.skills.join(", ") 
                : "Non spécifié"
            }
        </p>
        <p>
            <span className="font-medium">Disponibilité :</span> {user.availability || "Non spécifié"}
        </p>
      </div>
      
      {/* Bouton d'Action */}
      <button 
        onClick={() => onClickContact(user)}
        className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition"
      >
        Contacter / Démarrer l'Appel
      </button>
    </div>
  );
};

export default UserCard;