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
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider, // 👈 needed
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

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
    await setDoc(doc(db, "users", cred.user.uid), { email, role });
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

  // 👇 new: reauthenticate + change password
  const changePassword = async (currentPassword, newPassword) => {
    if (!auth.currentUser) throw new Error("No user logged in.");

    const cred = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );

    // 🔑 Reauthenticate first
    await reauthenticateWithCredential(auth.currentUser, cred);

    // ✅ Then update password
    await updatePassword(auth.currentUser, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{ user, role, loading, register, login, logout, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
