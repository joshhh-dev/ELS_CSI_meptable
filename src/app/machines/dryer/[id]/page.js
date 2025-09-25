"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useParams } from "next/navigation";
import { useCart } from "../../../context/CartContext";
import { toast } from "react-toastify";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Flame,
  Zap,
  Wind,
  Scale,
} from "lucide-react";

export default function DryerMachinePage() {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const loadMachine = async () => {
      try {
        const decodedId = decodeURIComponent(id);
        const ref = query(
          collection(db, "mep_dryers"),
          where("model", "==", decodedId)
        );
        const snap = await getDocs(ref);
        if (!snap.empty) setMachine(snap.docs[0].data());
        else setMachine(null);
      } catch (err) {
        console.error("Error loading dryer:", err);
        setMachine(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadMachine();
  }, [id]);

  const renderRow = (label, value) => (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-3 py-2 font-medium text-gray-600 text-sm sm:text-base">
        {label}
      </td>
      <td className="px-3 py-2 text-gray-800 text-center text-sm sm:text-base">
        {value || <span className="text-gray-400">—</span>}
      </td>
    </tr>
  );

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <motion.p
          className="text-base sm:text-lg font-semibold text-gray-600"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Loading dryer details...
        </motion.p>
      </div>
    );

  if (!machine)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-base sm:text-lg text-red-500">Dryer not found</p>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-10">
      {/* Back */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-sm sm:text-base"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        Back
      </button>

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full h-[250px] sm:h-[350px] md:h-[500px] bg-white"
      >
        {machine?.imageUrl ? (
          <Image
            src={machine.imageUrl}
            alt={machine.model || "Dryer Image"}
            fill
            className="object-contain"
          />
        ) : (
          <span className="text-gray-400 flex justify-center items-center h-full text-sm sm:text-base">
            No Image Available
          </span>
        )}
      </motion.div>

      {/* Machine Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3 text-center"
      >
        <h1 className="text-2xl sm:text-3xl font-bold">{machine.model}</h1>
        <h2 className="text-gray-500 text-sm sm:text-base">
          {machine.category || "Dryer"}
        </h2>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pt-4">
          {machine.capacity && (
            <span className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {machine.capacity}{" "}
              kg
            </span>
          )}
          {machine.heatSource && (
            <span className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-green-50 text-green-700 text-xs sm:text-sm font-medium">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {machine.heatSource}
            </span>
          )}
        </div>
      </motion.div>

      {/* General Specs */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="border-t pt-6 sm:pt-10"
      >
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
          General Specifications
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-t border-gray-200 text-gray-700 text-sm sm:text-base">
            <tbody>
              {renderRow("Description", machine.description)}
              {renderRow("Width", machine.width)}
              {renderRow("Height", machine.height)}
              {renderRow("Depth", machine.depth)}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Gas */}
      {machine.gasType && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="border-t pt-6 sm:pt-10"
        >
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
            🔥 Gas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-t border-gray-200 text-gray-700 text-sm sm:text-base">
              <tbody>
                {renderRow("Type", machine.gasType)}
                {renderRow("Load", machine.gasLoad)}
                {renderRow("Pressure", machine.gasPressure)}
                {renderRow("Connection Height", machine.gasConnectionHeight)}
                {renderRow("Supply Height", machine.gasSupplyHeight)}
                {renderRow("BTU/hr", machine.gasBTU)}
              </tbody>
            </table>
          </div>
        </motion.section>
      )}

      {/* Electricity */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="border-t pt-6 sm:pt-10"
      >
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
          ⚡ Electricity
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-t border-gray-200 text-gray-700 text-sm sm:text-base">
            <tbody>
              {renderRow("Voltage / Frequency / Phase", machine.voltage)}
              {renderRow("Total Load", machine.totalLoad)}
              {renderRow("Recommended Fuse", machine.recommendedFuse)}
              {renderRow("Connection Height", machine.connectionHeight)}
              {renderRow("Connection Type", machine.connectionType)}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Exhaust */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="border-t pt-6 sm:pt-10"
      >
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
          💨 Exhaust
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-t border-gray-200 text-gray-700 text-sm sm:text-base">
            <tbody>
              {renderRow("Diameter", machine.diameterFlow)}
              {renderRow("Pressure Drop - Pa", machine.pressureDrop)}
              {renderRow("Volume - m³/h", machine.volumeFlow)}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Floating Add to Cart */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] sm:w-auto sm:translate-x-0 sm:left-auto sm:right-6 lg:static"
      >
        <button
          onClick={() => {
            toast.success(`${machine.model} added to cart ✅`);
            addToCart(machine);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-green-600 text-white hover:bg-green-700 transition text-sm sm:text-lg font-semibold shadow-md hover:shadow-lg"
        >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Add for Computation</span>
          <span className="sm:hidden">Add</span>
        </button>
      </motion.div>
    </div>
  );
}
