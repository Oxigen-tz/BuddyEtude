import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
// NOTE: Vous devez créer getProfileData(uid) dans firebase/services.js
import { getProfileData } from "../firebase/services"; 

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Protection côté client contre l'accès sans authentification
  if (authLoading) return <div className="p-6 text-center">Chargement de l'authentification...</div>;
  if (!user) return <div className="p-6 text-center text-red-500">Vous devez être connecté pour voir cette page.</div>;


  // 2. Récupération des données de la collection Firestore/users
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProfileData(user.uid);
        setProfileData(data);
      } catch (e) {
        setError("Impossible de charger les données de votre profil.");
        console.error("Erreur de chargement du profil:", e);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  
  if (loading) return <div className="p-6 text-center">Chargement du profil complet...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Erreur: {error}</div>;


  // Affichage des informations si les données sont prêtes
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-xl mt-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Mon Profil ({user.displayName || "Utilisateur"})</h1>

      <div className="flex items-center mb-6 border-b pb-4">
        {/* Avatar/Photo */}
        <div className="w-16 h-16 rounded-full bg-gray-200 mr-4 overflow-hidden">
            {user.photoURL && (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            )}
        </div>
        <div>
            <p className="text-xl font-semibold">{user.displayName || "Non spécifié"}</p>
            <p className="text-gray-600">{user.email}</p>
        </div>
      </div>

      {profileData ? (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700">Préférences d'étude</h2>
            
            <p><strong>Niveau :</strong> {profileData.level || 'Non renseigné'}</p>
            <p><strong>Disponibilité :</strong> {profileData.availability || 'Non renseignée'}</p>
            
            <p>
                <strong>Matières/Compétences :</strong> 
                {profileData.skills?.length ? profileData.skills.join(", ") : "Aucune compétence enregistrée."}
            </p>
            <p>
                <strong>Wishlist :</strong> 
                {profileData.wishlist?.length ? profileData.wishlist.join(", ") : "Votre liste de souhaits est vide."}
            </p>
            
            {/* Bouton de modification */}
            <button 
                // La navigation vers l'édition serait une bonne prochaine étape
                className="mt-6 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-semibold transition"
            >
                Modifier le profil
            </button>
        </div>
      ) : (
        <p className="text-center text-gray-500">
            Aucune donnée de profil trouvée dans Firestore. Veuillez mettre à jour votre profil.
        </p>
      )}
    </div>
  );
};

export default Profile;