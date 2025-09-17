import { db } from "./firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

// CREATE
export async function addMachine(machine) {
  const docRef = await addDoc(collection(db, "machines"), machine);
  return { id: docRef.id, ...machine };
}

// READ
export async function getMachines() {
  const snapshot = await getDocs(collection(db, "machines"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// UPDATE
export async function updateMachine(id, updatedData) {
  const docRef = doc(db, "machines", id);
  await updateDoc(docRef, updatedData);
}

// DELETE
export async function deleteMachine(id) {
  const docRef = doc(db, "machines", id);
  await deleteDoc(docRef);
}
