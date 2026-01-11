import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import FindBuddy from './pages/FindBuddy';
import Profile from './pages/Profile';

// --- IMPORTS DÉCOMMENTÉS (ACTIVÉS) ---
import CallNotifier from './components/CallNotifier'; 
import GroupChat from './components/GroupChat'; 
import VideoCall from './components/VideoCall'; 

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header />
      
      {/* Notification d'appel (Doit être actif pour recevoir les appels partout) */}
      <CallNotifier /> 

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Routes Principales */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/find-buddy" element={<FindBuddy />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* --- ROUTES CHAT ET VIDÉO (ACTIVÉES) --- */}
        <Route path="/chat/:groupId" element={<GroupChat />} />
        <Route path="/call/:roomId" element={<VideoCall />} />
      </Routes>
    </div>
  );
}

export default App;