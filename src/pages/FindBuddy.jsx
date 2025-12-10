import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserCard from "../components/UserCard";
import { findBuddy } from "../firebase/matching"; // Logique de recherche
import { createCall } from "../firebase/videocall"; // Logique de création d'appel
import { useAuth } from "../context/AuthContext"; // Contexte d'authentification

// Données statiques pour les options des filtres (devraient idéalement venir de Firestore ou d'un fichier de config)
const SUBJECT_OPTIONS = ["Math", "Physique", "Informatique", "Biologie", "Chimie", "Histoire"];
const LEVEL_OPTIONS = ["Débutant", "Intermédiaire", "Avancé"];
const AVAILABILITY_OPTIONS = ["Matin", "Après-midi", "Soir", "Flexible"];

const FindBuddy = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États pour les filtres
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");

  // États pour les résultats et le processus
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false); // Chargement de la recherche
  const [callLoading, setCallLoading] = useState(false); // Chargement du lancement d'appel
  const [error, setError] = useState(null);

  // Fonction pour réinitialiser les filtres et les résultats
  const handleReset = () => {
    setSelectedSubject("");
    setSelectedLevel("");
    setSelectedAvailability("");
    setUsers([]);
    setError(null);
  };

  // Fonction pour lancer la recherche d'un Buddy
  const handleSearch = async () => {
    if (!user) {
      setError("Veuillez vous connecter pour lancer une recherche.");
      setUsers([]);
      return;
    }
    
    // Validation des filtres
    if (!selectedSubject || !selectedLevel || !selectedAvailability) {
      setError("Veuillez sélectionner une Matière, un Niveau ET une Disponibilité.");
      setUsers([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    setUsers([]);

    try {
      const results = await findBuddy({
        subject: selectedSubject,
        level: selectedLevel,
        availability: selectedAvailability,
        currentUserId: user.uid, // Exclure l'utilisateur courant des résultats
      });
      
      setUsers(results);
    } catch (e) {
      setError("Erreur lors de la recherche de Buddies. Assurez-vous que l'index composite Firestore est créé.");
      console.error("Erreur de recherche:", e);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour démarrer l'appel vidéo
  const handleContact = async (targetUser) => {
    if (!user) {
        navigate("/login"); 
        return;
    }
    if (callLoading) return;

    setCallLoading(true);
    setError(null);
    
    try {
        // 1. Créer le document d'appel dans Firestore (l'utilisateur courant est l'appelant)
        const newCallId = await createCall(user.uid, targetUser.id);
        
        // 2. Rediriger vers la salle d'appel nouvellement créée
        // L'utilisateur sera l'initiateur (caller) par défaut
        navigate(`/call/${newCallId}`); 

    } catch (e) {
        setError("Erreur lors du lancement de l'appel.");
        console.error("Erreur de création d'appel:", e);
        setCallLoading(false);
    }
  };


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-buddy-primary">Trouver un Buddy</h1>

      {/* === FILTRES ET ACTIONS === */}
      <div className="flex gap-4 mb-6 items-center flex-wrap p-4 border rounded-xl shadow-md bg-white">
        
        {/* Sélecteurs */}
        <select onChange={(e) => setSelectedSubject(e.target.value)} value={selectedSubject} className="border p-2 rounded focus:ring-blue-500 focus:border-blue-500">
          <option value="">Matière</option>
          {SUBJECT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>

        <select onChange={(e) => setSelectedLevel(e.target.value)} value={selectedLevel} className="border p-2 rounded focus:ring-blue-500 focus:border-blue-500">
          <option value="">Niveau</option>
          {LEVEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>

        <select onChange={(e) => setSelectedAvailability(e.target.value)} value={selectedAvailability} className="border p-2 rounded focus:ring-blue-500 focus:border-blue-500">
          <option value="">Disponibilité</option>
          {AVAILABILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>

        {/* Boutons d'Action */}
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition disabled:opacity-50 font-semibold"
          disabled={loading || callLoading || !user}
        >
          {loading ? "Recherche..." : "Rechercher"}
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-lg transition"
          disabled={loading || callLoading}
        >
          Réinitialiser
        </button>
      </div>
      
      {/* Message d'erreur / statut */}
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {callLoading && <p className="text-indigo-500 mb-4 text-center font-medium">Préparation de l'appel vidéo en cours...</p>}
      
      {/* === LISTE DES BUDDIES === */}
      <div className="mt-6">
        {loading && <p className="text-center p-8">Recherche des partenaires en cours...</p>}

        {!loading && users.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((buddy) => (
                    <UserCard 
                        key={buddy.id} 
                        user={buddy} 
                        onClickContact={() => handleContact(buddy)}
                    />
                ))}
            </div>
        )}
        
        {!loading && !error && users.length === 0 && (
            <p className="text-center p-8 border rounded-xl bg-gray-50 text-gray-600">
                {selectedSubject 
                    ? "Aucun Buddy trouvé pour cette combinaison de critères. Essayez d'élargir votre recherche !" 
                    : "Lancez votre première recherche de Buddy pour trouver un partenaire d'étude idéal."}
            </p>
        )}
      </div>
    </div>
  );
};

export default FindBuddy;