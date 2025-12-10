import React, { useEffect, useState } from "react";
import GroupCard from "../components/GroupCard";
// NOTE: La fonction getGroups doit être adaptée pour filtrer par utilisateur
import { getGroups } from "../firebase/services"; 
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Attendre que l'authentification soit terminée et que l'utilisateur soit présent
    if (authLoading || !user) {
      setLoading(false); // Le chargement des groupes commence après l'auth
      return; 
    }

    const fetchUserGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        // NOTE: getGroups doit être adapté côté Firebase pour n'obtenir que les groupes de cet utilisateur (user.uid)
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

  // Redirection/protection côté client
  if (authLoading) return <div className="p-6 text-center">Vérification de l'authentification...</div>;
  if (!user) return <div className="p-6 text-center text-red-500">Vous devez être connecté pour voir votre tableau de bord.</div>;

  if (loading) return <div className="p-6 text-center">Chargement de vos groupes...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Erreur: {error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Mes Groupes BuddyEtude</h1>
      
      {groups.length === 0 ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">Aucun groupe trouvé</p>
          <p>Vous n'êtes membre d'aucun groupe. Commencez par <Link to="/findbuddy" className="underline font-medium">Trouver un Buddy</Link> !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => <GroupCard key={group.id} group={group} />)}
        </div>
      )}
    </div>
  );
};

export default Dashboard;