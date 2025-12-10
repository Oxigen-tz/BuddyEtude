/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
        // Ajout des couleurs de marque pour plus de cohérence
        colors: {
            'buddy-primary': '#2563EB', // Bleu pour l'action principale
            'buddy-accent': '#DC2626',  // Rouge pour la déconnexion/danger
        },
    },
  },
  plugins: [],
};