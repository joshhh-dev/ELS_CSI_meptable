"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useParams } from "next/navigation";
import { useCart } from "../../../context/CartContext";
import { toast } from "react-toastify";
import Image from "next/image";

export default function WasherMachinePage() {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const loadMachine = async () => {
      try {
        const decodedId = decodeURIComponent(id);
        const ref = query(
          collection(db, "mep_washer"),
          where("model", "==", decodedId)
        );
        const snap = await getDocs(ref);
        if (!snap.empty) setMachine(snap.docs[0].data());
        else setMachine(null);
      } catch (err) {
        console.error("Error loading machine:", err);
        setMachine(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadMachine();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg font-semibold animate-pulse text-gray-600">
          Loading machine details...
        </p>
      </div>
    );

  if (!machine)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-red-500">Machine not found</p>
      </div>
    );

  const renderRow = (label, value) => (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 font-medium text-gray-700">{label}</td>
      <td className="px-4 py-2 text-center text-gray-800">{value || "-"}</td>
    </tr>
  );
  console.log('Machine image URL:', machine?.imageUrl);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="mb-6 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Image */}
      <div className="lg:col-span-2 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shadow-md h-80 relative">
        {machine?.imageUrl ? (
          <Image
            src={machine.imageUrl}
            alt={machine.model || "Machine Image"}
            fill
            className="object-contain rounded-lg"
          />
        ) : (
          <span className="text-gray-400">No Image Available</span>
        )}
      </div>

        {/* Specs */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-1">{machine.model}</h2>
            <h3 className="text-gray-600 text-center mb-4">{machine.category || "Category"}</h3>
            <table className="w-full text-left border-collapse divide-y divide-gray-200">
              <tbody>
                {renderRow("Description", machine.description)}
                {renderRow("Heat Type", machine.heatSource)}
                {renderRow("Width", machine.width)}
                {renderRow("Height", machine.height)}
                {renderRow("Depth", machine.depth)}
                {renderRow("Capacity", machine.capacity)}
                {renderRow("G Factor", machine.gFactor)}
              </tbody>
            </table>
          </div>

          {/* Water */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 text-center">Water</h3>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 text-gray-700 border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Specification</th>
                    <th className="p-2 border text-center">Cold Wash</th>
                    <th className="p-2 border text-center">Hot Wash</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2 font-semibold">Diameter</td>
                    <td className="border p-2 text-center">{machine?.coldWater?.diameter || "-"}</td>
                    <td className="border p-2 text-center">{machine?.hotWater?.diameter || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-semibold">Water Consumption</td>
                    <td className="border p-2 text-center">{machine?.coldWater?.waterConsump || "-"}</td>
                    <td className="border p-2 text-center">{machine?.hotWater?.waterConsump || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-semibold">Connection Height</td>
                    <td className="border p-2 text-center">{machine?.coldWater?.connectionHeight || "-"}</td>
                    <td className="border p-2 text-center">{machine?.hotWater?.connectionHeight || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-semibold">Supply Water Height</td>
                    <td className="border p-2 text-center">{machine?.coldWater?.supplyWaterHeight || "-"}</td>
                    <td className="border p-2 text-center">{machine?.hotWater?.supplyWaterHeight || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-semibold">Min. Pressure</td>
                    <td className="border p-2 text-center">{machine?.coldWater?.minPressure || "-"}</td>
                    <td className="border p-2 text-center">{machine?.hotWater?.minPressure || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-semibold">Max. Pressure</td>
                    <td className="border p-2 text-center">{machine?.coldWater?.maxPressure || "-"}</td>
                    <td className="border p-2 text-center">{machine?.hotWater?.maxPressure || "-"}</td>
                  </tr>
                </tbody>

              </table>
            </div>
          </div>

          {/* Electricity */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 text-center">Electricity</h3>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 text-gray-700 border">
                <tbody>
                  {renderRow("Voltage / Frequency / Phase", machine.voltage)}
                  {renderRow("Total Load", machine.totalLoad)}
                  {renderRow("Recommended Fuse", machine.recommendedFuse)}
                  {renderRow("Connection Height", machine.connectionHeight)}
                  {renderRow("Connection Type", machine.connectionType)}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={() => {
              toast.success(`${machine.model} added to cart ✅`);
              addToCart(machine);
            }}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            ➕ Add for Computation
          </button>
        </div>
      </div>
    </div>
  );
}
