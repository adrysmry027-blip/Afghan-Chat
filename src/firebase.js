import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Add the Firebase Web App settings to the hosting environment as VITE_FIREBASE_*.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredConfig = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"];
export const firebaseConfigured = requiredConfig.every((key) => Boolean(firebaseConfig[key]));

const app = firebaseConfigured
  ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : null;
export const database = app ? getDatabase(app) : null;
export const googleProvider = new GoogleAuthProvider();

export function requireFirebase() {
  if (!firebaseConfigured || !auth || !database) {
    throw new Error("تنظیمات وب فایربیس کامل نیست. متغیرهای VITE_FIREBASE_* را تنظیم کن.");
  }
  return { auth, database };
}
