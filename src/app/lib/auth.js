"use client";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { app } from "./firebase";

export const auth = getAuth(app);

//Email login
export const loginWithEmail = (email,  password) =>
    signInWithEmailAndPassword(auth, email, password);

//Google login
const provider = new GoogleAuthProvider();
export const loginWithGoogle = () => signInWithPopup(auth, provider);

//logout
export const logout = () => signOut(auth);

//Track user state
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
