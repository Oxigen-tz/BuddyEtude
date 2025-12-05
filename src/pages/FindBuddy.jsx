import React, { useEffect, useState } from "react";
import UserCard from "../components/UserCard";
import { findBuddy } from "../firebase/matching";

const FindBuddy = () => {
  // États pour les filtres
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");

  // Liste des utilisateurs trouvés
  const [users, setUsers] = useState([]);

  // Fonction pour lancer la recherche
  const handleSearch = async () => {
    // Si aucun filtre n'est choisi, ne rien faire
    if (!selectedSubject || !selectedLevel || !selectedAvailability) {
      alert("Veuillez sélectionner tous les filtres !");
      return;
    }

    const results = await findBuddy({
      subject: selectedSubject,
      level: selectedLevel,
      availability: selectedAvailability,
    });

    setUsers(results);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trouver un Buddy</h1>

      {/* === FILTRES === */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="">Matière</option>
          <option value="Math">Math</option>
          <option value="Physique">Physique</option>
          <option value="Informatique">Informatique</option>
        </select>

        <select
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="">Niveau</option>
          <option value="Débutant">Débutant</option>
          <option value="Intermédiaire">Intermédiaire</option>
          <option value="Avancé">Avancé</option>
        </select>

        <select
          onChange={(e) => setSelectedAvailability(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="">Disponibilité</option>
          <option value="Matin">Matin</option>
          <option value="Après-midi">Après-midi</option>
          <option value="Soir">Soir</option>
        </select>

        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Rechercher
        </button>
      </div>

      {/* === LISTE DES BUDDIES === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.length > 0 ? (
          users.map((user) => <UserCard key={user.id} user={user} />)
        ) : (
          <p>Aucun Buddy trouvé pour ces critères.</p>
        )}
      </div>
    </div>
  );
};

export default FindBuddy;
