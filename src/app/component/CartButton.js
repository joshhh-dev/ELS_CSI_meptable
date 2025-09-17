"use client";
import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function CartButton() {
  const { cart } = useCart();

  return (
    <Link
      href="/cart"
      className="relative bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100"
    >
      🛒
      {cart.length > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
          {cart.length}
        </span>
      )}
    </Link>
  );
}
