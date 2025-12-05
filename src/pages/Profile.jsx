import React from "react";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();

  if (!user) return <p>Vous devez être connecté</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mon Profil</h1>
      <p><strong>Nom :</strong> {user.displayName}</p>
      <p><strong>Email :</strong> {user.email}</p>
      {/* Ajouter plus d’infos : compétences, wishlist, disponibilité */}
    </div>
  );
};

export default Profile;
