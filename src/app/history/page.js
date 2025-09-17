"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { rtdb } from "../lib/firebase";
import { ref, onValue } from "firebase/database";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const dbRef = ref(rtdb, `carts/${user.uid}`);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formatted = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setOrders(formatted.reverse()); // newest first
      } else {
        setOrders([]);
      }
    });

    return () => unsubscribe();
  }, [user, router]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📜 Order History</h1>

      {orders.length === 0 ? (
        <p className="text-gray-600">No finalized carts yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <h2 className="font-semibold mb-2">
                🗓 {new Date(order.timestamp).toLocaleString()}
              </h2>

              <ul className="list-disc list-inside space-y-1">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{item.model}</span> –{" "}
                    {item.capacity} (x{item.quantity})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
