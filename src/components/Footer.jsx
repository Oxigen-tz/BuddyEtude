import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-200 text-center p-4 mt-10">
      &copy; {new Date().getFullYear()} BuddyEtude. Tous droits réservés.
    </footer>
  );
};

export default Footer;
