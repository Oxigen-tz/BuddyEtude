import React, { useEffect, useState } from "react";
// 🟢 CORRECTION : Ajout de Link, nécessaire pour le bloc "Aucun groupe trouvé"
import { Link } from "react-router-dom"; 
import GroupCard from "../components/GroupCard";
import { getGroups } from "../firebase/services"; 
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Attendre que l'authentification soit terminée et que l'utilisateur soit présent
    if (authLoading || !user) {
      // Si l'auth est en cours ou si l'utilisateur est déconnecté, on ne charge pas les groupes.
      setLoading(false); 
      return; 
    }

    const fetchUserGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        // 2. Récupérer les groupes où l'utilisateur est membre
        // (La logique de filtrage par user.uid est supposée être dans firebase/services.js)
        const allGroups = await getGroups(user.uid); 
        setGroups(allGroups);
      } catch (e) {
        setError("Impossible de charger vos groupes.");
        console.error("Erreur chargement groupes:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserGroups();
  }, [user, authLoading]);

  // =======================================================================
  // Rendu conditionnel
  // =======================================================================

  // A. État initial ou chargement de l'auth
  if (authLoading) return <div className="p-6 text-center">Vérification de l'authentification...</div>;
  
  // B. Utilisateur déconnecté (redondant si PrivateRoute fonctionne, mais bonne pratique)
  if (!user) return <div className="p-6 text-center text-red-500">Vous devez être connecté pour voir votre tableau de bord.</div>;

  // C. Chargement des groupes
  if (loading) return <div className="p-6 text-center">Chargement de vos groupes...</div>;
  
  // D. Erreur de connexion Firestore
  if (error) return <div className="p-6 text-center text-red-500">Erreur: {error}</div>;

  // E. Rendu final
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Mes Groupes BuddyEtude</h1>
      
      {groups.length === 0 ? (
        // Message si aucun groupe n'est trouvé
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">Aucun groupe trouvé</p>
          <p>Vous n'êtes membre d'aucun groupe. Commencez par <Link to="/findbuddy" className="underline font-medium">Trouver un Buddy</Link> !</p>
        </div>
      ) : (
        // Liste des Groupes
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => <GroupCard key={group.id} group={group} />)}
        </div>
      )}
    </div>
  );
};

export default Dashboard;