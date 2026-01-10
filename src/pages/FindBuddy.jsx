import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserCard from "../components/UserCard";
import { useAuth } from "../context/AuthContext";
import { createCall } from "../firebase/videocall";
// Nous allons utiliser une nouvelle fonction de matching plus puissante
import { searchUsersAdvanced } from "../firebase/matching"; 

// --- DONNÉES DE CONFIGURATION ---
const STUDY_PATHS = {
  "Lycée": ["Mathématiques", "Physique-Chimie", "SVT", "Français", "Philosophie", "Anglais"],
  "Licence Informatique": ["Algorithmique", "Bases de données", "Développement Web", "Architecture", "Maths Discrètes"],
  "Licence Droit": ["Droit Civil", "Droit Constitutionnel", "Histoire du Droit", "Relations Internationales"],
  "Médecine (PASS/LAS)": ["Anatomie", "Biochimie", "Physiologie", "Biophysique"],
  "École de Commerce": ["Marketing", "Finance", "Comptabilité", "Management"],
};

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const TIMES = ["Matin", "Après-midi", "Soirée"];
const LEVELS = ["Débutant", "Intermédiaire", "Avancé", "Expert"];

const FindBuddy = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- ÉTATS ---
  // 1. Cursus
  const [selectedStudyPath, setSelectedStudyPath] = useState("");
  
  // 2. Matières (Système de liste/tags)
  const [currentSubject, setCurrentSubject] = useState("");
  const [currentLevel, setCurrentLevel] = useState("Intermédiaire");
  const [selectedSubjectsList, setSelectedSubjectsList] = useState([]); // Tableau d'objets { subject, level }

  // 3. Disponibilités (Matrice Jours x Moments)
  // Format: { "Lundi": ["Matin", "Soirée"], "Mardi": ["Après-midi"] }
  const [availability, setAvailability] = useState({});

  // 4. Résultats
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [callLoading, setCallLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- GESTIONNAIRES D'INTERFACE ---

  // Ajout d'une matière à la liste
  const addSubject = () => {
    if (!currentSubject) return;
    // Évite les doublons
    if (selectedSubjectsList.some(item => item.subject === currentSubject)) {
        alert("Cette matière est déjà sélectionnée.");
        return;
    }
    setSelectedSubjectsList([...selectedSubjectsList, { subject: currentSubject, level: currentLevel }]);
    setCurrentSubject(""); // Reset select
  };

  // Suppression d'une matière
  const removeSubject = (subjectToRemove) => {
    setSelectedSubjectsList(selectedSubjectsList.filter(item => item.subject !== subjectToRemove));
  };

  // Gestion des cases à cocher Disponibilité
  const toggleAvailability = (day, time) => {
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      if (daySlots.includes(time)) {
        // Enlever
        return { ...prev, [day]: daySlots.filter(t => t !== time) };
      } else {
        // Ajouter
        return { ...prev, [day]: [...daySlots, time] };
      }
    });
  };

  // --- RECHERCHE ET APPEL ---

  const handleSearch = async () => {
    if (!user) return navigate("/login");
    
    // Validation
    if (!selectedStudyPath) {
        setError("Veuillez sélectionner un niveau d'études.");
        return;
    }
    if (selectedSubjectsList.length === 0) {
        setError("Veuillez ajouter au moins une matière.");
        return;
    }

    setLoading(true);
    setError(null);
    setUsers([]);

    try {
      // Appel à la nouvelle fonction de recherche intelligente
      const results = await searchUsersAdvanced({
        studyPath: selectedStudyPath,
        subjects: selectedSubjectsList, // On envoie la liste complète
        availability: availability,
        currentUserId: user.uid
      });
      setUsers(results);
    } catch (e) {
      console.error(e);
      setError("Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (targetUser) => {
    if (callLoading) return;
    setCallLoading(true);
    try {
        const newCallId = await createCall(user.uid, targetUser.id);
        navigate(`/call/${newCallId}`); 
    } catch (e) {
        alert("Erreur lancement appel");
        setCallLoading(false);
    }
  };

  // --- RENDU ---
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-buddy-primary">Recherche Avancée</h1>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-8">
        
        {/* 1. NIVEAU D'ÉTUDES */}
        <div>
            <label className="block text-gray-700 font-bold mb-2">1. Quel est votre cursus ?</label>
            <select 
                className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                value={selectedStudyPath}
                onChange={(e) => {
                    setSelectedStudyPath(e.target.value);
                    setSelectedSubjectsList([]); // Reset matières si cursus change
                }}
            >
                <option value="">Sélectionner un cursus...</option>
                {Object.keys(STUDY_PATHS).map(path => (
                    <option key={path} value={path}>{path}</option>
                ))}
            </select>
        </div>

        {/* 2. MATIÈRES ET NIVEAUX (Affiché seulement si cursus choisi) */}
        {selectedStudyPath && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <label className="block text-gray-700 font-bold mb-2">2. Quelles matières voulez-vous travailler ?</label>
                <div className="flex flex-col md:flex-row gap-2 mb-3">
                    <select 
                        className="flex-1 border p-2 rounded"
                        value={currentSubject}
                        onChange={(e) => setCurrentSubject(e.target.value)}
                    >
                        <option value="">Choisir une matière...</option>
                        {STUDY_PATHS[selectedStudyPath].map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                    
                    <select 
                        className="flex-1 border p-2 rounded"
                        value={currentLevel}
                        onChange={(e) => setCurrentLevel(e.target.value)}
                    >
                        {LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>

                    <button 
                        onClick={addSubject}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Ajouter
                    </button>
                </div>

                {/* Liste des tags sélectionnés */}
                <div className="flex flex-wrap gap-2">
                    {selectedSubjectsList.map((item, idx) => (
                        <span key={idx} className="bg-white text-blue-800 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200 flex items-center shadow-sm">
                            {item.subject} <span className="text-gray-500 text-xs ml-1">({item.level})</span>
                            <button onClick={() => removeSubject(item.subject)} className="ml-2 text-red-500 hover:text-red-700 font-bold">×</button>
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* 3. DISPONIBILITÉS (GRILLE) */}
        <div>
            <label className="block text-gray-700 font-bold mb-4">3. Vos disponibilités</label>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead>
                        <tr>
                            <th className="p-2"></th>
                            {TIMES.map(time => <th key={time} className="p-2 font-medium text-gray-600">{time}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map(day => (
                            <tr key={day} className="border-t">
                                <td className="p-2 font-medium">{day}</td>
                                {TIMES.map(time => {
                                    const isChecked = availability[day]?.includes(time);
                                    return (
                                        <td key={`${day}-${time}`} className="p-2">
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                checked={!!isChecked}
                                                onChange={() => toggleAvailability(day, time)}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* BOUTON RECHERCHE */}
        <div className="pt-4 border-t">
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button
                onClick={handleSearch}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-[1.01]"
                disabled={loading || callLoading}
            >
                {loading ? "Recherche des meilleurs profils..." : "Trouver mon Binôme 🔍"}
            </button>
        </div>

      </div>

      {/* RÉSULTATS */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Résultats ({users.length})</h2>
        {users.length > 0 ? (
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
            !loading && <p className="text-gray-500">Lancez une recherche pour voir les résultats.</p>
        )}
      </div>
    </div>
  );
};

export default FindBuddy;