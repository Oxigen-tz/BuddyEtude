import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getProfileData, getGroups } from "../firebase/services";
import GroupCard from "../components/GroupCard";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const userProfile = await getProfileData(user.uid);
          setProfile(userProfile);
          const userGroups = await getGroups(user.uid);
          setGroups(userGroups);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-buddy-primary">Dashboard</h1>
        <button 
            onClick={() => navigate("/profile")}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium shadow-sm transition"
        >
            ⚙️ Gérer mon profil
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Résumé Profil (Lecture seule) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
             <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-md overflow-hidden">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    profile?.name?.charAt(0) || "U"
                )}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{profile?.name || "Utilisateur"}</h2>
            <p className="text-blue-600 font-medium mb-4">{profile?.studyPath || "Filière non définie"}</p>
            
            <div className="flex flex-wrap gap-2 justify-center">
                {profile?.skills?.map((s, i) => (
                    <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs border">
                        {s.name} <span className="text-gray-400">| {s.level}</span>
                    </span>
                ))}
            </div>
          </div>
        </div>

        {/* Liste des Groupes */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[400px]">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes Groupes actifs</h2>
              {groups.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                    {groups.map(g => <GroupCard key={g.id} group={g} />)}
                </div>
              ) : (
                <div className="text-center py-10 opacity-60">
                    <p>Aucun groupe pour le moment.</p>
                    <button onClick={() => navigate("/find-buddy")} className="text-blue-500 underline mt-2">Trouver un binôme</button>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;