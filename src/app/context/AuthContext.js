// app/context/AuthContext.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // ✅ track role
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // fetch role from Firestore
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRole(snap.data().role);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const register = async (email, password, role = "user") => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Save role in Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      role,
    });
  };

  const login = async (email, password, redirectPath = "/") => {
    await signInWithEmailAndPassword(auth, email, password);
    router.replace(redirectPath);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, role, loading, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
