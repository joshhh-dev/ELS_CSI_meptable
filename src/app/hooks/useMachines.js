"use client";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export function useMachines() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMachines() {
      try {
        const categories = ["mep_washer", "mep_dryer", "mep_ironer"]; // ✅ add collections here
        let allMachines = [];

        for (const category of categories) {
          const snapshot = await getDocs(collection(db, category));
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            category, // ✅ tag with category
            ...doc.data(),
          }));
          allMachines = [...allMachines, ...data];
        }

        setMachines(allMachines);
      } catch (error) {
        console.error("Error fetching machines:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMachines();
  }, []);

  return { machines, loading };
}
