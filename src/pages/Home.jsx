import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="text-center mt-20">
      <h1 className="text-4xl font-bold mb-4">Bienvenue sur BuddyEtude</h1>
      <p className="mb-6">Trouvez votre partenaire d'étude idéal et formez des groupes efficaces !</p>

      {/* Bouton visible et stylé */}
      <Link
        to="/findbuddy"
        className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded shadow transition duration-200"
      >
        Trouver un Buddy
      </Link>
    </div>
  );
};

export default Home;
