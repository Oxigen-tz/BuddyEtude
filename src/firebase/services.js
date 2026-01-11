import { db, storage } from "./config"; 
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { updateProfile } from "firebase/auth";

const USERS_COLLECTION = "users";
const GROUPS_COLLECTION = "groups";

// =======================================================================
// SERVICES UTILISATEUR
// =======================================================================

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

// Upload photo de profil
export const uploadAvatar = async (file, user) => {
    const fileRef = ref(storage, `avatars/${user.uid}`);
    await uploadBytes(fileRef, file);
    const photoURL = await getDownloadURL(fileRef);
    
    await updateProfile(user, { photoURL });
    await updateProfileData(user.uid, { photoURL });
    
    return photoURL;
};

// =======================================================================
// SERVICES GROUPES
// =======================================================================

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

// --- NOUVELLE FONCTION (UPLOAD FICHIER CHAT) ---
export const uploadChatFile = async (file, groupId) => {
    try {
        // On crée un chemin unique : group_files/ID_DU_GROUPE/TIMESTAMP_NOM
        const fileRef = ref(storage, `group_files/${groupId}/${Date.now()}_${file.name}`);
        
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        return url;
    } catch (error) {
        console.error("Erreur upload chat:", error);
        throw error;
    }
};