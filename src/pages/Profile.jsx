import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
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
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", studyPath: "", skills: [], photoURL: "" });

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
        } catch (e) { console.error(e); } finally { setLoading(false); }
      }
    };
    fetchProfile();
  }, [user]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Max 2MB"); return; }
    setUploading(true);
    try {
        const newPhotoURL = await uploadAvatar(file, user);
        setFormData(prev => ({ ...prev, photoURL: newPhotoURL }));
    } catch (error) { alert("Erreur upload."); } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfileData(user.uid, formData);
      setIsEditing(false);
    } catch (e) { alert("Erreur"); } finally { setLoading(false); }
  };

  // Helpers pour les skills
  const addSkill = (subject) => { if (!formData.skills.find(s => s.name === subject)) setFormData({ ...formData, skills: [...formData.skills, { name: subject, level: "Intermédiaire" }] }); };
  const removeSkill = (subject) => { setFormData({ ...formData, skills: formData.skills.filter(s => s.name !== subject) }); };
  const updateSkillLevel = (subject, level) => { setFormData({ ...formData, skills: formData.skills.map(s => s.name === subject ? { ...s, level } : s) }); };

  if (authLoading || loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />

      {/* BANNIÈRE DÉCORATIVE (NOUVEAU) */}
      <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 w-full"></div>

      <div className="max-w-4xl mx-auto px-4 -mt-24">
        
        {/* CARTE PRINCIPALE */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6">
                
                {/* AVATAR (Décalé vers le haut) */}
                <div className="relative -mt-16 md:-mt-20 group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-lg">
                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 border-4 border-white relative">
                            {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs z-10">Chargement...</div>}
                            {formData.photoURL ? (
                                <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">?</div>
                            )}
                        </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-md hover:scale-110 transition">
                         📷
                    </div>
                </div>

                {/* INFOS */}
                <div className="flex-1 text-center md:text-left mb-2">
                    <h1 className="text-3xl font-bold text-gray-800">{formData.name || "Utilisateur"}</h1>
                    <p className="text-gray-500 font-medium">{user.email}</p>
                </div>
                
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-6 py-2.5 rounded-xl font-bold transition shadow-sm mb-4 md:mb-0 ${isEditing ? 'bg-gray-100 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {isEditing ? "Annuler" : "✏️ Modifier"}
                </button>
            </div>
        </div>

        {/* CONTENU DU FORMULAIRE */}
        <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
            {isEditing ? (
                <div className="space-y-8">
                    {/* Mode Édition (Même logique qu'avant, juste un peu de style) */}
                    <div>
                        <h2 className="text-xl font-bold text-blue-800 border-b pb-2 mb-4">Mes Informations</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nom d'affichage</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Filière</label>
                                <select value={formData.studyPath} onChange={(e) => setFormData({...formData, studyPath: e.target.value, skills: []})} className="w-full border rounded-lg p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500">
                                    <option value="">-- Choisir --</option>
                                    {Object.keys(STUDY_PATHS).map(path => (<option key={path} value={path}>{path}</option>))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {formData.studyPath && (
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <label className="block text-sm font-bold text-blue-800 mb-4">MATIÈRES & NIVEAUX</label>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {STUDY_PATHS[formData.studyPath].map(subject => {
                                    const isSelected = formData.skills.some(s => s.name === subject);
                                    return (
                                        <button key={subject} onClick={() => !isSelected && addSkill(subject)} disabled={isSelected}
                                            className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${isSelected ? 'opacity-50 cursor-not-allowed bg-blue-200 text-blue-800' : 'bg-white hover:bg-blue-100 text-blue-600 border-blue-200'}`}>
                                            + {subject}
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.skills.map((skill, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between gap-2 border border-blue-100">
                                        <span className="font-bold text-gray-700 ml-2">{skill.name}</span>
                                        <select value={skill.level} onChange={(e) => updateSkillLevel(skill.name, e.target.value)} className="text-sm p-1 border rounded bg-gray-50">
                                            {SKILL_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                        </select>
                                        <button onClick={() => removeSkill(skill.name)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform hover:-translate-y-1">
                        💾 Enregistrer
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Mode Lecture */}
                    <div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Filière d'études</h3>
                        <p className="text-xl font-medium text-gray-800">{formData.studyPath || "Non définie"}</p>
                    </div>
                    <div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Compétences</h3>
                        {formData.skills && formData.skills.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {formData.skills.map((skill, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition group">
                                        <span className="font-bold text-gray-700">{skill.name}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
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
    </div>
  );
};

export default Profile;