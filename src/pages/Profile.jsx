import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
// On ajoute updateProfileData aux imports
import { getProfileData, updateProfileData } from "../firebase/services"; 

// --- DONNÉES DE CONFIGURATION ---
const STUDY_PATHS = {
  "Lycée": ["Mathématiques", "Physique-Chimie", "SVT", "Français", "Philosophie", "Anglais", "Histoire-Géo"],
  "Licence Informatique": ["Algorithmique", "Développement Web", "Bases de Données", "Réseaux", "Maths Discrètes", "Java/C++"],
  "Licence Droit": ["Droit Civil", "Droit Constitutionnel", "Histoire du Droit", "Relations Internationales"],
  "Médecine (PASS/LAS)": ["Anatomie", "Biochimie", "Biophysique", "Histologie", "Pharmacologie"],
  "École de Commerce": ["Marketing", "Finance", "Comptabilité", "Management", "Économie"],
  "Autre": ["Langues", "Art", "Musique", "Cuisine"]
};

const SKILL_LEVELS = ["Débutant", "Intermédiaire", "Avancé", "Expert"];

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  
  // États pour les données
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // État pour le mode Édition
  const [isEditing, setIsEditing] = useState(false);
  
  // Formulaire
  const [formData, setFormData] = useState({
    name: "",
    studyPath: "",
    skills: [] // Tableau d'objets { name, level }
  });

  // 1. Chargement des données
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          const data = await getProfileData(user.uid);
          if (data) {
            setFormData({
              name: data.name || user.displayName || "",
              studyPath: data.studyPath || "",
              skills: data.skills || []
            });
          }
        } catch (e) {
          setError("Impossible de charger le profil.");
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user]);

  // 2. Gestionnaires du formulaire
  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfileData(user.uid, formData);
      setIsEditing(false); // On repasse en mode lecture
      // Optionnel : un petit message de succès ou toast
    } catch (e) {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  // Ajout d'une matière
  const addSkill = (subject) => {
    if (!formData.skills.find(s => s.name === subject)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { name: subject, level: "Intermédiaire" }]
      });
    }
  };

  // Suppression d'une matière
  const removeSkill = (subject) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s.name !== subject)
    });
  };

  // Mise à jour du niveau
  const updateSkillLevel = (subject, level) => {
    setFormData({
      ...formData,
      skills: formData.skills.map(s => s.name === subject ? { ...s, level } : s)
    });
  };

  if (authLoading || loading) return <div className="p-10 text-center">Chargement...</div>;
  if (!user) return <div className="p-10 text-center text-red-500">Accès refusé.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen bg-gray-50">
      
      {/* En-tête de la page */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-2xl font-bold text-blue-600">{formData.name?.charAt(0) || "U"}</span>
                )}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{formData.name || "Utilisateur"}</h1>
                <p className="text-gray-500">{user.email}</p>
            </div>
        </div>
        
        {/* BOUTON TOGGLE ÉDITION */}
        <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg font-bold transition ${isEditing ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
            {isEditing ? "Annuler" : "Modifier mon profil"}
        </button>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
        
        {isEditing ? (
            /* --- MODE ÉDITION (FORMULAIRE) --- */
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-blue-800 border-b pb-2">Éditer mes informations</h2>
                
                {/* Nom */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom d'affichage</label>
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* Filière */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Filière d'études</label>
                    <select 
                        value={formData.studyPath} 
                        onChange={(e) => setFormData({...formData, studyPath: e.target.value, skills: []})}
                        className="w-full border border-gray-300 rounded-lg p-3 bg-white"
                    >
                        <option value="">-- Sélectionner --</option>
                        {Object.keys(STUDY_PATHS).map(path => (
                            <option key={path} value={path}>{path}</option>
                        ))}
                    </select>
                </div>

                {/* Compétences & Niveaux */}
                {formData.studyPath && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="block text-sm font-bold text-blue-800 mb-3">Mes Matières & Niveaux</label>
                        
                        {/* Boutons d'ajout */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {STUDY_PATHS[formData.studyPath].map(subject => {
                                const isSelected = formData.skills.some(s => s.name === subject);
                                return (
                                    <button 
                                        key={subject}
                                        onClick={() => !isSelected && addSkill(subject)}
                                        disabled={isSelected}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition ${isSelected ? 'opacity-40 cursor-not-allowed' : 'bg-white hover:bg-blue-100 text-blue-600 border-blue-200'}`}
                                    >
                                        + {subject}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Liste des matières sélectionnées */}
                        <div className="space-y-2">
                            {formData.skills.map((skill, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <span className="font-bold text-gray-700">{skill.name}</span>
                                    <div className="flex items-center gap-2">
                                        <select 
                                            value={skill.level} 
                                            onChange={(e) => updateSkillLevel(skill.name, e.target.value)}
                                            className="text-sm p-1.5 border rounded bg-gray-50"
                                        >
                                            {SKILL_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                        </select>
                                        <button onClick={() => removeSkill(skill.name)} className="text-red-400 hover:text-red-600 p-1">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button 
                    onClick={handleSave}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transition transform hover:-translate-y-1"
                >
                    Enregistrer les modifications
                </button>
            </div>
        ) : (
            /* --- MODE LECTURE (AFFICHAGE) --- */
            <div className="space-y-6">
                <div>
                    <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide">Filière</h3>
                    <p className="text-xl font-medium text-gray-800">{formData.studyPath || "Non définie"}</p>
                </div>

                <div>
                    <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide mb-3">Compétences</h3>
                    {formData.skills && formData.skills.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {formData.skills.map((skill, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="font-semibold text-gray-700">{skill.name}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                        skill.level === 'Expert' ? 'bg-purple-100 text-purple-700' :
                                        skill.level === 'Avancé' ? 'bg-green-100 text-green-700' :
                                        skill.level === 'Intermédiaire' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-200 text-gray-600'
                                    }`}>
                                        {skill.level}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 italic">Aucune compétence ajoutée.</p>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Profile;