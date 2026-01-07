"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartButton() {
  const { cart } = useCart();

  const totalItems = cart.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  return (
    <Link
      href="/cart"
      className="relative bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
      title="Add to cart"
    >
      <Plus size={18} />

      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
