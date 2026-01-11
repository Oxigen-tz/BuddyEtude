import { db, storage } from "./config"; // <--- Import de 'storage'
import { 
    collection, 
    doc, 
    getDocs, 
    query, 
    where, 
    setDoc, 
    addDoc, 
    serverTimestamp,
    getDoc 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // <--- Nouveaux imports Storage
import { updateProfile } from "firebase/auth";

const USERS_COLLECTION = "users";
const GROUPS_COLLECTION = "groups";

// --- SERVICES UTILISATEUR ---

export const syncUserProfile = async (user) => {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        await setDoc(userRef, {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL || null,
            level: "Débutant",
            availability: "Flexible",
            skills: [],
            createdAt: serverTimestamp()
        }, { merge: true });
    }
};

export const getProfileData = async (userId) => {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

export const updateProfileData = async (userId, data) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, data, { merge: true });
};

// --- NOUVELLE FONCTION UPLOAD PHOTO ---
export const uploadAvatar = async (file, user) => {
    // 1. On crée une référence : "avatars/ID_UTILISATEUR"
    const fileRef = ref(storage, `avatars/${user.uid}`);
    
    // 2. On envoie le fichier
    await uploadBytes(fileRef, file);
    
    // 3. On récupère le lien public (URL)
    const photoURL = await getDownloadURL(fileRef);
    
    // 4. On met à jour l'Authentification Firebase
    await updateProfile(user, { photoURL });
    
    // 5. On met à jour la base de données Firestore
    await updateProfileData(user.uid, { photoURL });
    
    return photoURL;
};

// --- SERVICES GROUPES ---

export const getGroups = async (userId) => {
    const groupsRef = collection(db, GROUPS_COLLECTION);
    const q = query(groupsRef, where("members", "array-contains", userId));
    const querySnapshot = await getDocs(q);
    const groups = [];
    querySnapshot.forEach((doc) => {
        groups.push({ id: doc.id, ...doc.data() });
    });
    return groups;
};

export const startDirectChat = async (currentUserId, targetUserId, targetUserName) => {
    const groupRef = await addDoc(collection(db, GROUPS_COLLECTION), {
        name: `Chat avec ${targetUserName}`,
        members: [currentUserId, targetUserId],
        type: "private",
        createdAt: serverTimestamp(),
        lastMessage: "Discussion commencée",
        lastMessageTime: serverTimestamp()
    });
    return groupRef.id;
};