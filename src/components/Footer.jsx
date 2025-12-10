import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-6 mt-10 shadow-inner">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
        {/* Section Copyright */}
        <p>&copy; {new Date().getFullYear()} BuddyEtude. Tous droits réservés.</p>

        {/* Section Liens */}
        <nav className="flex space-x-4 mt-2 md:mt-0">
          <a href="/about" className="hover:text-blue-400 transition">À Propos</a>
          {/* Liens légaux essentiels */}
          <a href="/terms" className="hover:text-blue-400 transition">Conditions d'Utilisation</a>
          <a href="/privacy" className="hover:text-blue-400 transition">Politique de Confidentialité</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;