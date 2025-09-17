// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAcOTd6xvhdRefRZC8cXeK_lXAQxDYcXf8",
  authDomain: "meptable-883d6.firebaseapp.com",
  databaseURL: "https://meptable-883d6-default-rtdb.firebaseio.com",
  projectId: "meptable-883d6",
  storageBucket: "meptable-883d6.firebasestorage.app",
  messagingSenderId: "197916345708",
  appId: "1:197916345708:web:166f3c4e0351f22d8a9f49",
  measurementId: "G-CNBL5QYLGB"
};

// Initialize Firebase

const db = initializeApp(firebaseConfig);
export const app = getFirestore(db);