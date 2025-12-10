import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();
  
  return (
    <div className="text-center mt-16 p-6 max-w-4xl mx-auto">
      <h1 className="text-5xl font-extrabold mb-4 text-gray-900">
        Bienvenue sur BuddyEtude
      </h1>
      <p className="text-xl text-gray-600 mb-10">
        Trouvez votre partenaire d'étude idéal pour réviser, collaborer et progresser ensemble.
      </p>

      {/* Section CTA */}
      <div className="space-y-4 md:space-y-0 md:space-x-6"> 
        <Link
          to="/findbuddy"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition duration-200 transform hover:scale-105"
        >
          Commencer la Recherche
        </Link>
        
        {!user && (
          <Link
            to="/login"
            className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-8 py-3 rounded-xl shadow transition duration-200"
          >
            Se connecter
          </Link>
        )}
      </div>

      {/* Ajout d'une section d'explication */}
      <div className="mt-20 grid md:grid-cols-3 gap-8 text-left">
          <div className="p-4 rounded-lg bg-white shadow-md">
              <h3 className="font-bold text-lg mb-2 text-blue-800">1. Définissez vos besoins</h3>
              <p className="text-gray-600 text-sm">Matières, niveau de compétence et vos disponibilités.</p>
          </div>
          <div className="p-4 rounded-lg bg-white shadow-md">
              <h3 className="font-bold text-lg mb-2 text-blue-800">2. Trouvez votre match</h3>
              <p className="text-gray-600 text-sm">Notre algorithme trouve les partenaires les plus compatibles.</p>
          </div>
          <div className="p-4 rounded-lg bg-white shadow-md">
              <h3 className="font-bold text-lg mb-2 text-blue-800">3. Collaborez !</h3>
              <p className="text-gray-600 text-sm">Discutez, partagez des ressources et lancez des visios.</p>
          </div>
      </div>
    </div>
  );
};

export default Home;