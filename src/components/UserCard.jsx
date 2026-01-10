import React from "react";

const UserCard = ({ user, onClickContact }) => {
  // Fonction pour obtenir les initiales (ex: "Charles Bertreux" -> "CB")
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      
      {/* Partie Haute : Avatar + Infos */}
      <div className="flex items-start space-x-4">
        {/* Avatar Rond avec Initiales */}
        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(user.name)
          )}
        </div>

        {/* Informations */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {user.name || "Utilisateur Inconnu"}
          </h3>
          <p className="text-blue-600 font-medium text-sm mb-1">
            {user.level || "Niveau non spécifié"}
          </p>
          
          {/* Affichage des tags (Matières) */}
          <div className="flex flex-wrap gap-1 mt-2">
            {user.skills && user.skills.length > 0 ? (
              user.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">Matières non spécifiées</span>
            )}
            {user.skills && user.skills.length > 3 && (
              <span className="text-xs text-gray-400">+{user.skills.length - 3}</span>
            )}
          </div>
        </div>
      </div>

      {/* Partie Basse : Bouton d'action */}
      <div className="mt-5">
        <button
          onClick={onClickContact}
          className="w-full bg-buddy-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <span className="text-lg">💬</span> Discuter
        </button>
      </div>
    </div>
  );
};

export default UserCard;