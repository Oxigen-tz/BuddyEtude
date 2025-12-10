import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
define: {
    global: 'window',
  },
  // AJOUTER LA SECTION ROLLUP POUR IGNORER LE FICHIER GOOGLE
  /*
  build: {
    rollupOptions: {
      input: {
        main: 'index.html', // Point d'entrée principal
      },
    },
  },*/
});