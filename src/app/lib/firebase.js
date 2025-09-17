// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage"; // ✅ Import storage

const firebaseConfig = {
  apiKey: "AIzaSyAcOTd6xvhdRefRZC8cXeK_lXAQxDYcXf8",
  authDomain: "meptable-883d6.firebaseapp.com",
  databaseURL: "https://meptable-883d6-default-rtdb.firebaseio.com",
  projectId: "meptable-883d6",
  storageBucket: "meptable-883d6.appspot.com", // ✅ corrected format
  messagingSenderId: "197916345708",
  appId: "1:197916345708:web:166f3c4e0351f22d8a9f49",
  measurementId: "G-CNBL5QYLGB",
};

// Initialize Firebase once
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Exports
const db = getFirestore(app);               // Firestore
const rtdb = getDatabase(app);              // Realtime Database
const auth = getAuth(app);                  // Authentication
const provider = new GoogleAuthProvider();  // Optional: Google sign-in
const storage = getStorage(app);            // ✅ Cloud Storage

export { app, db, rtdb, auth, provider, storage }; // ✅ export storage
