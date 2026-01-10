import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserCard from "../components/UserCard";
import { findBuddy } from "../firebase/matching";
import { startDirectChat } from "../firebase/services"; // <--- Import de la nouvelle fonction
import { useAuth } from "../context/AuthContext";

// --- CONFIGURATION DES DONNÉES ---

const STUDY_PATHS = {
  "Lycée": ["Mathématiques", "Physique-Chimie", "SVT", "Français", "Philosophie", "Anglais", "Histoire-Géo"],
  "Licence Informatique": ["Algorithmique", "Développement Web", "Bases de Données", "Réseaux", "Maths Discrètes", "Java/C++"],
  "Licence Droit": ["Droit Civil", "Droit Constitutionnel", "Histoire du Droit", "Relations Internationales"],
  "Médecine (PASS/LAS)": ["Anatomie", "Biochimie", "Biophysique", "Histologie", "Pharmacologie"],
  "École de Commerce": ["Marketing", "Finance", "Comptabilité", "Management", "Économie"],
  "Autre": ["Langues", "Art", "Musique", "Cuisine"]
};

const SKILL_LEVELS = ["Débutant", "Intermédiaire", "Avancé", "Expert"];
const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const TIME_SLOTS = ["Matin (8h-12h)", "Après-midi (13h-18h)", "Soirée (19h-23h)"];

const FindBuddy = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- ÉTATS (STATE) ---
  const [selectedStudyPath, setSelectedStudyPath] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState("");
  
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [callLoading, setCallLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- GESTIONNAIRES ---

  const handleReset = () => {
    setSelectedStudyPath("");
    setSelectedSubjects([]);
    setSelectedSkillLevel("");
    setSelectedDays([]);
    setSelectedTimes([]);
    setUsers([]);
    setError(null);
  };

  const handlePathChange = (e) => {
    setSelectedStudyPath(e.target.value);
    setSelectedSubjects([]); 
  };

  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSearch = async () => {
    if (!user) return navigate("/login");

    if (!selectedStudyPath || selectedSubjects.length === 0 || !selectedSkillLevel) {
      setError("Veuillez sélectionner au moins une filière, une matière et un niveau.");
      return;
    }

    setLoading(true);
    setError(null);
    setUsers([]);

    try {
      const criteria = {
        studyPath: selectedStudyPath,
        subjects: selectedSubjects,
        level: selectedSkillLevel,
        days: selectedDays,
        times: selectedTimes,
        currentUserId: user.uid
      };

      console.log("Critères:", criteria);
      const results = await findBuddy(criteria);
      setUsers(results);

    } catch (e) {
      console.error("Erreur recherche:", e);
      setError("Erreur lors de la recherche. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (targetUser) => {
    if (callLoading) return;
    setCallLoading(true);
    
    try {
        console.log("Création du chat avec :", targetUser.name);
        // Créer le groupe et rediriger vers le Chat
        const newGroupId = await startDirectChat(user.uid, targetUser.id, targetUser.name);
        navigate(`/chat/${newGroupId}`); 
    } catch (e) {
        console.error(e);
        setError("Impossible de démarrer la discussion.");
    } finally {
        setCallLoading(false);
    }
  };

  // --- RENDU (JSX) ---

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-4xl font-extrabold mb-8 text-buddy-primary text-center">Trouver un Binôme</h1>

      <div className="bg-white p-8 rounded-2xl shadow-xl space-y-8">
        
        {/* 1. Filière et Niveau */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🎓 Cursus / Filière</label>
            <select 
              value={selectedStudyPath} 
              onChange={handlePathChange} 
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">-- Choisir un cursus --</option>
              {Object.keys(STUDY_PATHS).map(path => (
                <option key={path} value={path}>{path}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">⭐ Niveau recherché</label>
            <select 
              value={selectedSkillLevel} 
              onChange={(e) => setSelectedSkillLevel(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choisir un niveau --</option>
              {SKILL_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Matières */}
        {selectedStudyPath && (
          <div className="animate-fade-in">
            <label className="block text-sm font-semibold text-gray-700 mb-3">📚 Matières (Sélection multiple)</label>
            <div className="flex flex-wrap gap-2">
              {STUDY_PATHS[selectedStudyPath].map((subject) => {
                const isSelected = selectedSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    onClick={() => toggleSelection(subject, selectedSubjects, setSelectedSubjects)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                      ${isSelected 
                        ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105" 
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <hr className="border-gray-100" />

        {/* 3. Disponibilités */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">📅 Jours disponibles</label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleSelection(day, selectedDays, setSelectedDays)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border
                      ${isSelected 
                        ? "bg-green-500 text-white border-green-500 shadow-sm" 
                        : "bg-white text-gray-500 border-gray-200 hover:border-green-300"}`}
                  >
                    {day.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">⏰ Créneaux horaires</label>
            <div className="flex flex-col gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTimes.includes(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => toggleSelection(slot, selectedTimes, setSelectedTimes)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border text-left
                      ${isSelected 
                        ? "bg-purple-100 text-purple-700 border-purple-300" 
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                  >
                    {isSelected ? "✅" : "⬜"} {slot}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSearch}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-bold shadow-lg transition transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || callLoading}
          >
            {loading ? "Recherche en cours..." : "Lancer la recherche"}
          </button>
          
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition border border-transparent hover:border-gray-200"
            disabled={loading}
          >
            Réinitialiser
          </button>
        </div>

        {/* Erreurs */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* RÉSULTATS */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          Résultats 
          <span className="ml-3 text-sm font-normal text-white bg-gray-400 px-2 py-1 rounded-full">{users.length}</span>
        </h2>

        {!loading && users.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((buddy) => (
              <UserCard 
                key={buddy.id} 
                user={buddy} 
                onClickContact={() => handleContact(buddy)}
              />
            ))}
          </div>
        ) : (
          !loading && !error && (
            <div className="text-center py-20 opacity-50">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl">Configurez vos critères ci-dessus pour trouver votre binôme idéal.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FindBuddy;