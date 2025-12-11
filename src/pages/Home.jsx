import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Trouvez votre binôme d'études idéal
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Progressez ensemble, restez motivés et atteignez vos objectifs académiques grâce à BuddyEtude.
        </p>
        
        {user ? (
          <Link 
            to="/dashboard" 
            className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition duration-300"
          >
            Accéder à mon Dashboard
          </Link>
        ) : (
          <div className="space-x-4">
            <Link 
              to="/login" 
              className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition duration-300"
            >
              C'est parti !
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Pourquoi utiliser BuddyEtude ?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Objectifs Communs</h3>
            <p className="text-gray-600">
              Trouvez quelqu'un qui prépare les mêmes examens ou apprend les mêmes matières que vous.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">Chat & Vidéo</h3>
            <p className="text-gray-600">
              Échangez facilement grâce à notre chat intégré et lancez des sessions de travail en visio.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-2">Motivation Boostée</h3>
            <p className="text-gray-600">
              Ne révisez plus seul. L'entraide est la clé pour rester régulier et performant.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;