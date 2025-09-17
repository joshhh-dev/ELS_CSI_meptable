"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useCart } from "../../context/CartContext";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import Image from "next/image";

export default function IronersPage() {
  const [ironers, setIroners] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchIroners = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "mep_ironers"));
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setIroners(items);
      } catch (error) {
        console.error("Error fetching ironers:", error);
        toast.error("Failed to load ironers ❌");
      } finally {
        setLoading(false);
      }
    };
    fetchIroners();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg font-semibold animate-pulse text-blue-600">
          Loading machine details...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-800 tracking-wide">
        Ironer Machines
      </h1>

      {ironers.length === 0 ? (
        <p className="text-gray-500 text-lg">No ironer machines found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {ironers.map((ironer) => (
            <div
              key={ironer.id}
              className="relative group bg-white p-5 rounded-2xl border border-gray-200 
                shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              onClick={() => router.push(`/machines/ironer/${ironer.id}`)}
            >
              {/* Image placeholder */}
            <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg mb-4 relative">
              <Image
                src={ironer.imageUrl || "/placeholder.png"}
                alt={ironer.model || "Machine Image"}
                fill
                className="object-contain"
              />
            </div>

              <h2 className="text-lg font-semibold mb-2 text-gray-800">
                {ironer.model}
              </h2>
              <p className="text-sm text-gray-600">
                Capacity: <span className="font-medium">{ironer.capacity}</span>
              </p>
              <p className="text-sm text-gray-600">
                Heat Type: <span className="font-medium">{ironer.heatSource}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {ironer.description}
              </p>

              {/* Add to Cart Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(ironer);
                  toast.success(`${ironer.model} added to cart ✅`);
                }}
                className="absolute top-3 right-3 bg-blue-600 text-white p-2 rounded-full shadow-md 
                  hover:bg-blue-700 transition transform group-hover:scale-110"
              >
                <ShoppingCart size={18} />
              </button>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-blue-50 opacity-0 group-hover:opacity-30 transition duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
