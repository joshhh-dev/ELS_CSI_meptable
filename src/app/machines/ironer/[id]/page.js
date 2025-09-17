"use client";
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import { useCart } from "../../../context/CartContext";

export default function IroneDetailPage() {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const loadMachine = async () => {
      try {
        const decodedId = decodeURIComponent(id);
        const q = query(collection(db, "mep_ironers"), where("model", "==", decodedId));
        const snap = await getDocs(q);
        if (snap.empty) {
          setMachine(null);
        } else {
          setMachine(snap.docs[0].data());
        }
      } catch (err) {
        console.error(err);
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
          Loading ironer details...
        </p>
      </div>
    );

  if (!machine)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-red-500">Ironer not found</p>
      </div>
    );

  const renderTableRow = (label, value) => (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 font-medium text-gray-700">{label}</td>
      <td className="px-4 py-2 text-gray-800 text-center">{value || "-"}</td>
    </tr>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="mb-6 px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Image */}
        <div className="lg:col-span-2 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shadow-md h-96 relative">
          {machine.imageUrl ? (
            <Image
              src={machine.imageUrl || "/images/placeholder.png"}
              alt={machine.model}
              fill
              className="rounded-lg object-cover"
            />
          ) : (
            <span className="text-gray-400">No Image Available</span>
          )}
        </div>

        {/* Machine Specs */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-2">{machine.model}</h2>
            <h3 className="text-gray-600 text-center mb-4">{machine.category || "Category"}</h3>
            <table className="w-full text-left border-collapse divide-y divide-gray-200">
              <tbody>
                {renderTableRow("Description", machine.description)}
                {renderTableRow("Heat Type", machine.heatSource)}
                {renderTableRow("Width", machine.width)}
                {renderTableRow("Height", machine.height)}
                {renderTableRow("Depth", machine.depth)}
                {renderTableRow("Capacity", machine.capacity)}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gas */}
          {machine.gasType && (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-center">Gas</h3>
              <table className="w-full divide-y divide-gray-200 text-gray-700">
                <tbody>
                  {renderTableRow("Type", machine.gasType)}
                  {renderTableRow("Load", machine.gasLoad)}
                  {renderTableRow("Pressure", machine.gasPressure)}
                  {renderTableRow("Connection Height", machine.gasConnectionHeight)}
                  {renderTableRow("Supply Height", machine.gasSupplyHeight)}
                  {renderTableRow("BTU/hr", machine.gasBTU)}
                </tbody>
              </table>
            </div>
          )}


            {/* Electricity */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-center">Electricity</h3>
              <table className="w-full divide-y divide-gray-200 text-gray-700">
                <tbody>
                  {renderTableRow("Voltage / Frequency / Phase", machine.voltage)}
                  {renderTableRow("Total Load", machine.totalLoad)}
                  {renderTableRow("Recommended Fuse", machine.recommendedFuse)}
                  {renderTableRow("Connection Height", machine.connectionHeight)}
                  {renderTableRow("Connection Type", machine.connectionType)}
                </tbody>
              </table>
            </div>

            {/* Exhaust */}
            <div className="bg-white p-4 rounded-lg shadow-md md:col-span-2">
              <h3 className="text-xl font-bold mb-4 text-center">Exhaust</h3>
              <table className="w-full divide-y divide-gray-200 text-gray-700">
                <tbody>
                  {renderTableRow("Diameter", machine.diameterFlow)}
                  {renderTableRow("Pressure Drop - Pa", machine.pressureDrop)}
                  {renderTableRow("Volume - m³/h", machine.volumeFlow)}
                </tbody>
              </table>
            </div>
          </div>
            {/* Add to Cart Button */}
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
