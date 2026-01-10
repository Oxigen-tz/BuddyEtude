import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getProfileData, getGroups, updateProfileData } from "../firebase/services";
import GroupCard from "../components/GroupCard";

// --- CONSTANTES (Les mêmes que FindBuddy pour la cohérence) ---
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

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- ÉTATS ---
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Mode Édition
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    studyPath: "",
    skills: [], // Liste d'objets { name, level }
    days: [],
    times: []
  });

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // 1. Charger le profil
          const userProfile = await getProfileData(user.uid);
          setProfile(userProfile);
          
          // Initialiser le formulaire avec les données existantes
          if (userProfile) {
            setEditForm({
              name: userProfile.name || "",
              studyPath: userProfile.studyPath || "",
              skills: userProfile.skills || [], // Doit être un tableau d'objets
              days: userProfile.availability?.days || [], // Adapter selon votre structure existante
              times: userProfile.availability?.times || []
            });
          }

          // 2. Charger les groupes
          const userGroups = await getGroups(user.uid);
          setGroups(userGroups);
        } catch (error) {
          console.error("Erreur chargement dashboard:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user]);

  // --- GESTIONNAIRES D'ÉDITION ---

  const handleSave = async () => {
    try {
      // Sauvegarde dans Firebase
      await updateProfileData(user.uid, {
        name: editForm.name,
        studyPath: editForm.studyPath,
        skills: editForm.skills,
        availability: { // On structure la dispo
            days: editForm.days,
            times: editForm.times
        }
      });
      
      // Mise à jour locale
      setProfile({ ...profile, ...editForm, availability: { days: editForm.days, times: editForm.times } });
      setIsEditing(false);
      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  const handlePathChange = (e) => {
    setEditForm({ ...editForm, studyPath: e.target.value, skills: [] }); // Reset matières si changement filière
  };

  // Gestion des matières (Ajout/Suppression/Niveau)
  const addSkill = (subjectName) => {
    if (!editForm.skills.find(s => s.name === subjectName)) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, { name: subjectName, level: "Intermédiaire" }]
      });
    }
  };

  const removeSkill = (subjectName) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(s => s.name !== subjectName)
    });
  };

  const updateSkillLevel = (subjectName, newLevel) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.map(s => s.name === subjectName ? { ...s, level: newLevel } : s)
    });
  };

  const toggleSelection = (item, listName) => {
    const list = editForm[listName];
    if (list.includes(item)) {
      setEditForm({ ...editForm, [listName]: list.filter(i => i !== item) });
    } else {
      setEditForm({ ...editForm, [listName]: [...list, item] });
    }
  };

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-buddy-primary">
            Bonjour, {profile?.name || "Étudiant"} 👋
          </h1>
          <p className="text-gray-600">Gérez votre profil et vos groupes d'étude.</p>
        </div>
        <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">
          Se déconnecter
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* === COLONNE GAUCHE : PROFIL === */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Mon Profil</h2>
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-sm text-blue-600 hover:underline"
                >
                    {isEditing ? "Annuler" : "Modifier"}
                </button>
            </div>

            {isEditing ? (
              /* --- MODE ÉDITION --- */
              <div className="space-y-4 animate-fade-in">
                {/* Nom */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Nom</label>
                    <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full border rounded p-2 text-sm"
                    />
                </div>

                {/* Filière */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Filière</label>
                    <select 
                        value={editForm.studyPath} 
                        onChange={handlePathChange}
                        className="w-full border rounded p-2 text-sm"
                    >
                        <option value="">Sélectionner</option>
                        {Object.keys(STUDY_PATHS).map(path => (
                            <option key={path} value={path}>{path}</option>
                        ))}
                    </select>
                </div>

                {/* Matières et Niveaux */}
                {editForm.studyPath && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mes Compétences</label>
                        
                        {/* Liste des matières dispos */}
                        <div className="flex flex-wrap gap-1 mb-3">
                            {STUDY_PATHS[editForm.studyPath].map(subject => {
                                const isSelected = editForm.skills.some(s => s.name === subject);
                                return (
                                    <button 
                                        key={subject}
                                        onClick={() => !isSelected && addSkill(subject)}
                                        disabled={isSelected}
                                        className={`text-xs px-2 py-1 rounded-full border ${isSelected ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
                                    >
                                        {isSelected ? "✓" : "+"} {subject}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Configuration des niveaux */}
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {editForm.skills.map((skill, idx) => (
                                <div key={idx} className="bg-gray-50 p-2 rounded border flex justify-between items-center">
                                    <span className="text-sm font-medium">{skill.name}</span>
                                    <div className="flex items-center gap-1">
                                        <select 
                                            value={skill.level} 
                                            onChange={(e) => updateSkillLevel(skill.name, e.target.value)}
                                            className="text-xs p-1 rounded border"
                                        >
                                            {SKILL_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                        </select>
                                        <button onClick={() => removeSkill(skill.name)} className="text-red-500">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bouton Sauvegarder */}
                <button 
                    onClick={handleSave}
                    className="w-full bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600 transition"
                >
                    Enregistrer
                </button>
              </div>
            ) : (
              /* --- MODE VUE --- */
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                        {profile?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                        <p className="font-bold text-lg">{profile?.name}</p>
                        <p className="text-gray-500 text-sm">{profile?.studyPath || "Filière non définie"}</p>
                    </div>
                </div>

                <hr />

                <div>
                    <h3 className="font-bold text-gray-700 text-sm mb-2">Mes Matières Fortes</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile?.skills && profile.skills.length > 0 ? (
                            profile.skills.map((skill, i) => (
                                <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium border border-purple-100">
                                    {skill.name} <span className="text-purple-400 ml-1">({skill.level})</span>
                                </span>
                            ))
                        ) : (
                            <p className="text-gray-400 text-xs italic">Aucune compétence ajoutée</p>
                        )}
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === COLONNE DROITE : GROUPES === */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[500px]">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes Groupes de Révision</h2>
            
            {groups.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 text-lg mb-4">Vous n'avez pas encore de groupe.</p>
                <button 
                  onClick={() => navigate("/find-buddy")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition"
                >
                  Trouver un Buddy maintenant 🚀
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;