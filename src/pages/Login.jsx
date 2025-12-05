import React from "react";
import { auth } from "../firebase/config";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="text-center mt-20">
      <h1 className="text-3xl font-bold mb-6">Connexion BuddyEtude</h1>
      <button 
        onClick={handleGoogleLogin}
        className="bg-red-500 text-white px-6 py-2 rounded"
      >
        Se connecter avec Google
      </button>
    </div>
  );
};

export default Login;
