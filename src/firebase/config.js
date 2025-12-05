import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics"; // <-- à importer si tu utilises measurementId

const firebaseConfig = {
  apiKey: "AIzaSyApvyiWr08dLFF-VvSIB9XSCttJxUI7E0Q",
  authDomain: "buddyetude.firebaseapp.com",
  projectId: "buddyetude",
  storageBucket: "buddyetude.firebasestorage.app",
  messagingSenderId: "499725521618",
  appId: "1:499725521618:web:e4be390098951a909d130b"
  measurementId: "G-NV45DCH23X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const analytics = getAnalytics(app);