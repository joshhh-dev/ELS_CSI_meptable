"use client";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { rtdb } from "../lib/firebase";
import { ref, push, set } from "firebase/database";
import { useAuth } from "../context/AuthContext"; // ✅ import auth
import MachinesLayout from "../machines/layout";

export default function CartPage() {
  const { cart, removeFromCart, removeAllFromCart, clearCart, addToCart, updateQuantity } = useCart();
  const { user } = useAuth(); // ✅ logged-in user
  const router = useRouter();

  const finalizeCart = async () => {
    if (!user) {
      alert("You must be logged in to finalize your cart.");
      router.push("/login");
      return;
    }

    if (cart.length === 0) return;

    const dbRef = ref(rtdb, `carts/${user.uid}`); // ✅ per-user path
    const newCartRef = push(dbRef); // unique key

    try {
      await set(newCartRef, {
        items: cart,
        finalized: true,
        timestamp: new Date().toISOString(),
        email: user.email,
        uid: user.uid,
        role: user.role || "user", // ✅ attach role
      });

      clearCart();
      alert("✅ Cart finalized and stored in Realtime Database!");
      router.push(`/compute/${newCartRef.key}`);
    } catch (error) {
      console.error("❌ Failed to finalize cart:", error);
      alert("Failed to save cart. Check Firebase connection.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🛒 Your Machines</h1>

      {cart.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.id || item.model} className="flex justify-between items-center p-4 border rounded-lg shadow-sm">
              <div>
                <h2 className="font-semibold">{item.model}</h2>
                <p className="text-sm text-gray-600">Capacity: {item.capacity}</p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  ➖
                </button>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                  className="w-16 text-center border rounded px-2 py-1"
                />

                <button
                  onClick={() => addToCart(item)}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  ➕
                </button>

                <button
                  onClick={() => removeAllFromCart(item.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  🗑 Remove
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center mt-6">
            <p className="font-bold">
              Total Machines: {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
            <button
              onClick={clearCart}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Clear Cart
            </button>
            <button
              onClick={finalizeCart}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Finalize Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
