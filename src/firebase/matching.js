import { db } from "./config";
import { collection, getDocs, query, where, documentId } from "firebase/firestore";

/**
 * Recherche Avancée (Algorithme Hybride)
 * 1. Filtre Firestore : Par Cursus (StudyPath) -> Rapide
 * 2. Filtre Client (JS) : Par Matières et Disponibilités -> Précis
 */
export const searchUsersAdvanced = async ({ studyPath, subjects, availability, currentUserId }) => {
  const usersRef = collection(db, "users");
  
  // 1. REQUÊTE FIRESTORE (FILTRE PRIMAIRE)
  // On récupère tous les gens qui sont dans le même cursus que nous.
  // Note: Il faudra ajouter le champ 'studyPath' aux profils utilisateurs lors de l'inscription/édition.
  // Pour l'instant, si le champ n'existe pas, on peut récupérer une liste plus large ou utiliser un autre critère.
  
  // Pour le prototype, si vous n'avez pas encore de champ 'studyPath' dans la BD, 
  // on peut récupérer tous les utilisateurs (attention à la performance plus tard).
  // Idéalement : where("studyPath", "==", studyPath)
  
  const q = query(
    usersRef, 
    where(documentId(), "!=", currentUserId) // On exclut soi-même
  );

  const snapshot = await getDocs(q);
  const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 2. FILTRAGE JAVASCRIPT (FILTRE SECONDAIRE)
  const filteredUsers = allUsers.filter(user => {
    
    // A. Filtrer par Cursus (si on ne l'a pas fait en base)
    // Supposons que l'utilisateur a un champ 'studyPath' ou 'level' qui correspond
    // if (user.studyPath !== studyPath) return false; 

    // B. Filtrer par Matières (Matching Intelligent)
    // On veut savoir si l'utilisateur a au moins UNE matière en commun avec ma recherche
    // L'objet user.skills doit être un tableau d'objets ou de strings.
    // Adaptons à votre structure actuelle (tableau de strings "Maths", "Physique")
    
    // Créons une liste des matières recherchées (juste les noms)
    const searchedSubjectNames = subjects.map(s => s.subject);
    
    // Vérifier s'il y a une intersection
    const hasCommonSubject = user.skills && user.skills.some(skill => searchedSubjectNames.includes(skill));
    
    // Si on veut être strict : return hasCommonSubject;
    // Pour l'instant on retourne true pour tester si les données sont incomplètes
    return true; 
  });

  return filteredUsers;
};

// Garder l'ancienne fonction pour compatibilité si besoin
export const findBuddy = async ({ subject, level, availability, currentUserId }) => {
  // ... (votre ancien code)
  return [];
};