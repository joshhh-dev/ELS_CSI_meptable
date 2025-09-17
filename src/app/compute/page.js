"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rtdb } from "../lib/firebase";
import { ref, get, remove } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ComputationPage() {
  const [carts, setCarts] = useState([]);
  const router = useRouter();
  const { user } = useAuth(); // ✅ get logged-in user

  useEffect(() => {
    if (!user) return;

    const fetchAllCarts = async () => {
      const dbRef = ref(rtdb, `carts/${user.uid}`);
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const allCarts = snapshot.val();
        const cartList = Object.keys(allCarts).map((key) => ({
          id: key,
          ...allCarts[key],
        }));
        cartList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setCarts(cartList);
      } else {
        setCarts([]);
      }
    };

    fetchAllCarts();
  }, [user]);

  const deleteCart = async (cartId) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this cart?")) return;

    try {
      const cartRef = ref(rtdb, `carts/${user.uid}/${cartId}`);
      await remove(cartRef);
      setCarts((prev) => prev.filter((c) => c.id !== cartId));
    } catch (err) {
      console.error("Error deleting cart:", err);
      alert("Failed to delete cart. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">All Computations</h1>

      {carts.length === 0 ? (
        <p className="text-gray-500">Need to log in first.</p>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {carts.map((cart) => (
              <motion.div
                key={cart.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="p-4 border rounded-lg shadow-md bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative"
                onClick={() => router.push(`/compute/${cart.id}`)}
              >
                <div className="flex justify-between items-start">
                  <h2 className="font-semibold mb-2">
                    Cart ID: {cart.id} |{" "}
                    {new Date(cart.timestamp).toLocaleString()}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCart(cart.id);
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </motion.button>
                </div>

                <div className="space-y-1 text-sm">
                  {cart.items && cart.items.length > 0 ? (
                    cart.items.map((m, index) => (
                      <div
                        key={m.id || index}
                        className="flex justify-between text-gray-700"
                      >
                        <p>{m.model}</p>
                        <p>Qty: {m.quantity}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No items in this cart.</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
