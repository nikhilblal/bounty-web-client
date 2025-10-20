// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy, serverTimestamp, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA6DUo0zuGhJ_okPctOppXsPRW_v3j-F_g",
  authDomain: "bounty-c6d39.firebaseapp.com",
  projectId: "bounty-c6d39",
  storageBucket: "bounty-c6d39.firebasestorage.app",
  messagingSenderId: "626150282077",
  appId: "1:626150282077:web:944861a7716a07af400eb4",
  measurementId: "G-4JNXCXPVCH"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export const signIn = () => signInWithPopup(auth, provider);
export const logOut = () => signOut(auth);

// Firestore helpers
export { collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy, serverTimestamp, deleteDoc };

// Storage helpers
export { ref, uploadBytes, getDownloadURL };

