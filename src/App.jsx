import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import FindBuddy from "./pages/FindBuddy";
import Login from "./pages/Login";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/findbuddy" element={<FindBuddy />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
};

export default App;
