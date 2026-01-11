import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
// On importe uploadAvatar
import { getProfileData, updateProfileData, uploadAvatar } from "../firebase/services"; 

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
  const fileInputRef = useRef(null); // Référence pour le clic caché
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    studyPath: "",
    skills: [],
    photoURL: "" 
  });

  // 1. Chargement
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
              skills: data.skills || [],
              photoURL: user.photoURL || data.photoURL || "" 
            });
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user]);

  // 2. Gestion de l'Upload Image
  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert("L'image est trop lourde (Max 2MB)");
        return;
    }

    setUploading(true);
    try {
        const newPhotoURL = await uploadAvatar(file, user);
        setFormData(prev => ({ ...prev, photoURL: newPhotoURL }));
        alert("Photo de profil mise à jour ! 📸");
    } catch (error) {
        console.error("Erreur upload:", error);
        alert("Erreur lors de l'envoi de l'image.");
    } finally {
        setUploading(false);
    }
  };

  // 3. Sauvegarde Générale
  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfileData(user.uid, formData);
      setIsEditing(false);
      setError(null);
    } catch (e) {
      setError("Erreur sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (subject) => {
    if (!formData.skills.find(s => s.name === subject)) {
      setFormData({ ...formData, skills: [...formData.skills, { name: subject, level: "Intermédiaire" }] });
    }
  };
  const removeSkill = (subject) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s.name !== subject) });
  };
  const updateSkillLevel = (subject, level) => {
    setFormData({ ...formData, skills: formData.skills.map(s => s.name === subject ? { ...s, level } : s) });
  };


  if (authLoading || loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen bg-gray-50">
      
      {/* INPUT FILE CACHÉ */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: "none" }} 
      />

      {/* EN-TÊTE */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
            
            {/* AVATAR CLIQUABLE */}
            <div className="relative group cursor-pointer" onClick={handleImageClick} title="Changer la photo">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative">
                    {uploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : null}
                    
                    {formData.photoURL ? (
                        <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-blue-600">{formData.name?.charAt(0) || "U"}</span>
                    )}
                </div>
                
                {/* Icône Caméra au survol */}
                <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 z-20">
                    <span className="text-white text-xl">📷</span>
                </div>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-gray-800">{formData.name || "Utilisateur"}</h1>
                <p className="text-gray-500 text-sm">{user.email}</p>
                <button onClick={handleImageClick} className="text-xs text-blue-600 hover:underline mt-1 font-semibold">
                    Changer la photo
                </button>
            </div>
        </div>
        
        <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`px-5 py-2 rounded-lg font-bold transition shadow-sm ${isEditing ? 'bg-gray-100 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
            {isEditing ? "Annuler" : "Modifier mon profil"}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
        {isEditing ? (
            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-bold text-blue-800 border-b pb-2 mb-4">Informations Générales</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nom d'affichage</label>
                            <input 
                                type="text" value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Filière d'études</label>
                            <select 
                                value={formData.studyPath} 
                                onChange={(e) => setFormData({...formData, studyPath: e.target.value, skills: []})}
                                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Sélectionner --</option>
                                {Object.keys(STUDY_PATHS).map(path => (<option key={path} value={path}>{path}</option>))}
                            </select>
                        </div>
                    </div>
                </div>

                {formData.studyPath && (
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <label className="block text-sm font-bold text-blue-800 mb-4 uppercase tracking-wide">
                            Sélectionnez vos matières & niveaux
                        </label>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {STUDY_PATHS[formData.studyPath].map(subject => {
                                const isSelected = formData.skills.some(s => s.name === subject);
                                return (
                                    <button key={subject} onClick={() => !isSelected && addSkill(subject)} disabled={isSelected}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${isSelected ? 'opacity-40 cursor-not-allowed bg-gray-100' : 'bg-white hover:bg-blue-100 text-blue-600 border-blue-200 shadow-sm'}`}>
                                        + {subject}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="space-y-3">
                            {formData.skills.map((skill, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-100">
                                    <span className="font-bold text-gray-700 ml-2">{skill.name}</span>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <select value={skill.level} onChange={(e) => updateSkillLevel(skill.name, e.target.value)}
                                            className="text-sm p-2 border rounded bg-gray-50 flex-1 sm:flex-none">
                                            {SKILL_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                        </select>
                                        <button onClick={() => removeSkill(skill.name)} className="text-red-400 hover:text-red-600 p-2 rounded transition">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <button onClick={handleSave} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:-translate-y-1">
                    Enregistrer les modifications
                </button>
            </div>
        ) : (
            <div className="space-y-8">
                <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Filière</h3>
                    <p className="text-xl font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 inline-block">
                        {formData.studyPath || "Non définie"}
                    </p>
                </div>
                <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Compétences déclarées</h3>
                    {formData.skills && formData.skills.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {formData.skills.map((skill, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                                    <span className="font-bold text-gray-700">{skill.name}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${skill.level === 'Expert' ? 'bg-purple-100 text-purple-700' : skill.level === 'Avancé' ? 'bg-green-100 text-green-700' : skill.level === 'Intermédiaire' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {skill.level}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 italic">Aucune compétence ajoutée.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default Profile;