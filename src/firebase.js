import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase Web App configuration for Afghan Chat.
const firebaseConfig = {
  apiKey: "AIzaSyD78NpbqI4WtZSMgm7SY6d0h1EMX21FQQg",
  authDomain: "afghan-chat-4d04a.firebaseapp.com",
  databaseURL: "https://afghan-chat-4d04a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "afghan-chat-4d04a",
  storageBucket: "afghan-chat-4d04a.firebasestorage.app",
  messagingSenderId: "347231228222",
  appId: "1:347231228222:web:a4281ef06b4b6f23b49c6f",
  measurementId: "G-PWXGMGH3R4",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
export const firebaseConfigured = true;

export function requireFirebase() {
  return { auth, database };
}
