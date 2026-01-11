import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Liste des matières (La même que dans Profile)
const SUBJECTS = [
  "Mathématiques", "Physique-Chimie", "SVT", "Français", "Philosophie", "Anglais", 
  "Histoire-Géo", "Algorithmique", "Développement Web", "Droit Civil", 
  "Marketing", "Finance", "Anatomie"
];

const FindBuddy = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);

  // 1. Récupérer TOUS les utilisateurs au chargement
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // On enlève soi-même de la liste (on ne veut pas se trouver soi-même)
        const others = usersList.filter(u => u.id !== user.uid);
        
        setAllUsers(others);
        setFilteredUsers(others); // Par défaut, on montre tout le monde
      } catch (error) {
        console.error("Erreur fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchUsers();
  }, [user]);

  // 2. Filtrer quand on change la recherche
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredUsers(allUsers);
    } else {
      const results = allUsers.filter(buddy => {
        // Vérification de sécurité si le profil est incomplet
        if (!buddy.skills || !Array.isArray(buddy.skills)) return false;

        // On regarde si L'UNE des compétences du buddy correspond à la recherche
        return buddy.skills.some(skill => skill.name === searchTerm);
      });
      setFilteredUsers(results);
    }
  }, [searchTerm, allUsers]);

  // 3. Créer un groupe de discussion (Contact)
  const handleContact = async (buddy) => {
    if (creatingChat) return;
    setCreatingChat(true);

    try {
      // On cherche si une conversation existe déjà entre ces 2 personnes (Optionnel mais propre)
      // Pour faire simple ici : on crée un nouveau groupe direct
      
      const groupName = `${user.displayName || "Moi"} & ${buddy.name || "Binôme"}`;
      
      const docRef = await addDoc(collection(db, "groups"), {
        name: groupName,
        members: [user.uid, buddy.id], // VOUS + LE BINÔME
        createdAt: serverTimestamp(),
        lastMessage: "Groupe créé",
        lastMessageTime: serverTimestamp(),
        lastSenderId: user.uid
      });

      // Redirection vers le chat
      navigate(`/chat/${docRef.id}`);

    } catch (error) {
      console.error("Erreur création chat:", error);
      alert("Impossible de contacter cette personne.");
    } finally {
      setCreatingChat(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Recherche des profils...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* EN-TÊTE & FILTRE */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
          <h1 className="text-2xl font-bold text-blue-900 mb-4">Trouver un binôme 🤝</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Filtrer par matière</label>
              <select 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Tout voir --</option>
                {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* RÉSULTATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((buddy) => (
              <div key={buddy.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-100 flex flex-col">
                
                {/* Header Carte */}
                <div className="p-6 flex items-center gap-4 border-b border-gray-50">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {buddy.photoURL ? (
                      <img src={buddy.photoURL} alt={buddy.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xl text-gray-500">
                        {buddy.name ? buddy.name.charAt(0) : "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{buddy.name || "Utilisateur"}</h3>
                    <p className="text-sm text-blue-600 font-medium">{buddy.studyPath || "Filière inconnue"}</p>
                  </div>
                </div>

                {/* Compétences */}
                <div className="p-6 flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Compétences</p>
                  <div className="flex flex-wrap gap-2">
                    {buddy.skills && buddy.skills.length > 0 ? (
                      buddy.skills.slice(0, 4).map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                          {skill.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm italic">Aucune compétence renseignée</span>
                    )}
                    {buddy.skills && buddy.skills.length > 4 && (
                        <span className="px-2 py-1 text-gray-400 text-xs">+ {buddy.skills.length - 4}</span>
                    )}
                  </div>
                </div>

                {/* Bouton Action */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button 
                    onClick={() => handleContact(buddy)}
                    disabled={creatingChat}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md flex items-center justify-center gap-2"
                  >
                    {creatingChat ? "Création..." : "💬 Contacter"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-500 font-medium">Aucun binôme trouvé pour cette matière.</p>
              <button onClick={() => setSearchTerm("")} className="mt-4 text-blue-600 font-bold hover:underline">Voir tout le monde</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindBuddy;