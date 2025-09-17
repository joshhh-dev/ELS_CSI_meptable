// app/developer/page.js
"use client";

import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";

export default function DeveloperPage() {
  const { user, role, register } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (role === "developer") {
      loadUsers();
    }
  }, [role]);

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "users", id));
    loadUsers();
  };

  const handleUpdateRole = async (id, newRole) => {
    await updateDoc(doc(db, "users", id), { role: newRole });
    loadUsers();
  };

  if (role !== "developer") {
    return <p>⛔ Access denied. Developers only.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Developer Mode</h1>

      {/* Add new user */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const email = e.target.email.value;
          const password = e.target.password.value;
          await register(email, password, "user");
          loadUsers();
          e.target.reset();
        }}
        className="my-4"
      >
        <input type="email" name="email" placeholder="Email" required className="border p-2" />
        <input type="password" name="password" placeholder="Password" required className="border p-2 mx-2" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">Add User</button>
      </form>

      {/* User list */}
      <ul>
        {users.map((u) => (
          <li key={u.id} className="flex justify-between items-center border-b py-2">
            <span>{u.email} ({u.role})</span>
            <div>
              <button
                onClick={() => handleUpdateRole(u.id, u.role === "user" ? "developer" : "user")}
                className="bg-yellow-500 text-white px-3 py-1 mx-1"
              >
                Toggle Role
              </button>
              <button
                onClick={() => handleDelete(u.id)}
                className="bg-red-500 text-white px-3 py-1"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
