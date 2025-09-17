"use client";
import { useCart } from "../context/CartContext";

export default function CartSummary() {
  const { cart, removeMachine, updateQuantity, getTotalConsumption } = useCart();
  const totals = getTotalConsumption();

  if (!cart.length) return <p className="p-4">No machines selected.</p>;

  return (
    <div className="p-4 border rounded-lg shadow-lg bg-white max-w-xl mx-auto mt-4">
      <h2 className="text-xl font-bold mb-4">Selected Machines</h2>
      {cart.map((m) => (
        <div key={m.id} className="flex justify-between items-center mb-2">
          <div>
            <p className="font-semibold">{m.model}</p>
            <p className="text-sm">{m.collection.replace("mep_", "")}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={m.quantity ?? ""}
              onChange={(e) => updateQuantity(m.id, parseInt(e.target.value))}
              className="w-16 border rounded p-1 text-center"
            />
            <button
              onClick={() => removeMachine(m.id)}
              className="text-red-500 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <div className="mt-4 border-t pt-2">
        <p>⚡ Electricity: {totals.electricity} kWh</p>
        <p>🔥 Gas: {totals.gas} m³</p>
        <p>💧 Water: {totals.water} L</p>
      </div>
    </div>
  );
}
