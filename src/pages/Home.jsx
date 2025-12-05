import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="text-center mt-20">
      <h1 className="text-4xl font-bold mb-4">Bienvenue sur BuddyEtude</h1>
      <p className="mb-6">Trouvez votre partenaire d'étude idéal et formez des groupes efficaces !</p>
      <Link to="/findbuddy" className="bg-blue-500 text-white px-6 py-2 rounded">Trouver un Buddy</Link>
    </div>
  );
};

export default Home;
