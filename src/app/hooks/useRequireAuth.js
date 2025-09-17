"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function useRequireAuth() {
  const { user, loading } = useAuth(); // user=null if not logged in
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // redirect to login without adding to history
      router.replace("/login");
    }
  }, [user, loading, router]);

  return { user, loading };
}
