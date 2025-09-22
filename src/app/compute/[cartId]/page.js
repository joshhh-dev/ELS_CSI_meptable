"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { rtdb } from "../../lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { useAuth } from "../../context/AuthContext"; 
import UserRatesInput from "./UserRatesInput";
import toast, { Toaster } from "react-hot-toast";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis
} from "recharts";

// Currency formatter
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

// Conversion constants
const BTU_TO_KG_GAS = 47654.2;
const GAS_EFFICIENCY = 0.6;

const COLORS = ["#4f46e5", "#f97316", "#0ea5e9", "#f43f5e"];

export default function CartDetailPage() {
  const { user } = useAuth(); 
  const params = useParams();
  const router = useRouter();
  const cartId = params.cartId;

  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [hour, setHour] = useState();
  const [loading, setLoading] = useState(false);
  const [categoryRates, setCategoryRates] = useState({});

  //toggle state: "Usage" or "currency"
  const [viewMode, setViewMode] = useState("usage");

  const soon = () => {
      router.replace("../../about");
  }

  // Real-time fetch from Firebase
  useEffect(() => {
    if (!user) return; 
    const dbRef = ref(rtdb, `carts/${user.uid}/${cartId}`);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCart(data);
        setItems(data.items ? Object.values(data.items) : []);
        setHour(data.hour || 12);
        setCategoryRates(data.categoryRates || {});
      }
    });
    return () => unsubscribe();
  }, [user, cartId]);

  const HOT_WATER_TEMP_RISE = 60; // °C

  const calculateCostPerLoad = useCallback(
    (machine) => {
      const qty = machine.quantity || 0;
      if (!qty || !hour)
        return { electricity: 0, waterCold: 0, waterHot: 0, gas: 0, rawGasHotWater: 0 };

      const cat = machine.category.toUpperCase();
      const ratesKey =
        cat.includes("WASHER")
          ? `washer_${machine.category}`
          : cat.includes("DRYER")
          ? `dryer_${machine.category}`
          : cat.includes("IRONER")
          ? `ironers_${machine.category}`
          : machine.category;

      const rates = categoryRates[ratesKey] || {};

      // Electricity
      const electricUsage = (parseFloat(machine.totalLoad) || 0) * qty * hour;

      // Water
      const coldUsage =
        cat.includes("WASHER")
          ? ((parseFloat(machine.coldWater?.waterConsump) || 0) / 1000) * qty * hour
          : 0;
      const hotUsage =
        cat.includes("WASHER")
          ? ((parseFloat(machine.hotWater?.waterConsump) || 0) / 1000) * qty * hour
          : 0;

      // Gas
      let gasUsage = 0;
      let rawGasHotWater = 0;
      let rawGasDryer = 0;
      let rawGasIroner = 0;

      if (cat.includes("WASHER") && machine.hotWater?.waterConsump) {
        rawGasHotWater =
          ((parseFloat(machine.hotWater?.waterConsump) || 0) * 8.34 * HOT_WATER_TEMP_RISE) /
          46452 *
          qty *
          hour;
        gasUsage = rawGasHotWater;
      } else if (cat.includes("DRYER")) {
        rawGasDryer =
          ((parseFloat(machine.gasBTU) || 0) / BTU_TO_KG_GAS) * GAS_EFFICIENCY * qty * hour;
        gasUsage = rawGasDryer;
      } else if (cat.includes("IRONER")) {
        rawGasIroner =
          ((parseFloat(machine.gasBTU) || 0) / BTU_TO_KG_GAS) * GAS_EFFICIENCY * qty * hour;
        gasUsage = rawGasIroner;
      }

    return {
      electricity: electricUsage * (rates.electricity || 0),
      waterCold: coldUsage * (rates.waterCold || 0),
      waterHot: hotUsage * (rates.waterHot || 0),
      gas: gasUsage * (rates.gas || 0),
      rawElectricity: electricUsage, // ✅ usage (kWh)
      rawGasHotWater,
      rawGasDryer,
      rawGasIroner,
      rawColdWater: coldUsage,
      rawHotWater: hotUsage,
    };

    },
    [hour, categoryRates]
  );

  // Grand totals
    const totals = useMemo(() => {
      return items.reduce(
        (acc, m) => {
          const c = calculateCostPerLoad(m);
          acc.electricity += c.electricity;
          acc.waterCold += c.waterCold;
          acc.waterHot += c.waterHot;
          acc.gas += c.gas;

          acc.rawElectricity += c.rawElectricity;
          acc.rawGasHotWater += c.rawGasHotWater;
          acc.rawGasDryer += c.rawGasDryer;
          acc.rawGasIroner += c.rawGasIroner; // ✅
          acc.rawColdWater += c.rawColdWater;
          acc.rawHotWater += c.rawHotWater;
          return acc;
        },
        { 
          electricity: 0, waterCold: 0, waterHot: 0, gas: 0,
          rawElectricity: 0, rawGasHotWater: 0,
          rawGasDryer: 0, rawGasIroner: 0, // ✅ initialize
          rawColdWater: 0, rawHotWater: 0,
        }
      );
    }, [items, calculateCostPerLoad]);


  // Pie chart data
  const pieData = useMemo(() => [
    { name: "Electricity", value: totals.electricity },
    { name: "Gas", value: totals.gas },
    { name: "Cold Water", value: totals.waterCold },
    { name: "Hot Water", value: totals.waterHot },
  ], [totals]);

  // Bar chart data
  const barData = useMemo(() => items.map((m) => {
    const c = calculateCostPerLoad(m);
    return {
      name: m.model || m.category,
      electricity: c.electricity,
      gas: c.gas,
      waterCold: c.waterCold,
      waterHot: c.waterHot,

      // ✅ usage values (non-currency)
      rawElectricity: c.rawElectricity,
      rawGasHotWater: c.rawGasHotWater,
      rawGasDryer: c.rawGasDryer,
      rawGasIroner: c.rawGasIroner,   // <-- added this
      rawColdWater: c.rawColdWater,
      rawHotWater: c.rawHotWater,

    };
  }), [items, calculateCostPerLoad]);

  const saveCart = async () => {
    if (!cart || !user) return;
    setLoading(true);

    try {
      const dbRef = ref(rtdb, `carts/${user.uid}/${cartId}`);
      await set(dbRef, { ...cart, items, totals, hour, categoryRates });
      toast.success("Cart saved successfully!");
    } catch (error) {
      console.error("Error saving cart:", error);
      toast.error("Failed to save cart. Try again.");
    } finally {
      setLoading(false);
    }
  };


// XLSX export: single sheet, columns per machine + Total column
const exportToXLSX = async () => {
  try {
    const XLSX = await import("xlsx");

    const machines = (items || []).map((m, i) => ({
      name: (m.model || m.category || `Machine ${i + 1}`).toString(),
      totalLoad: Number(parseFloat(m.totalLoad || 0)),
      gasBTU: Number(parseFloat(m.gasBTU || 0)),
      coldLiters: Number(parseFloat(m?.coldWater?.waterConsump || 0)),
      hotLiters: Number(parseFloat(m?.hotWater?.waterConsump || 0)),
      exhaustM3h: Number(parseFloat(m?.exhaust?.volume || 0)),
    }));

    // ✅ Merge duplicates
    const machineMap = {};
    machines.forEach((m) => {
      if (!machineMap[m.name]) {
        machineMap[m.name] = { ...m };
      } else {
        machineMap[m.name].totalLoad += m.totalLoad;
        machineMap[m.name].gasBTU += m.gasBTU;
        machineMap[m.name].coldLiters += m.coldLiters;
        machineMap[m.name].hotLiters += m.hotLiters;
        machineMap[m.name].exhaustM3h += m.exhaustM3h;
      }
    });
    const merged = Object.values(machineMap);

    // ✅ Use merged machines everywhere
    const header = ["Type", ...merged.map((m) => m.name), "Total Consumption"];
    const modelRow = ["Model", ...merged.map((m) => m.name), ""];

    const sum = (arr) =>
      arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

    const rowElectricity = [
      "Average Consumption (kW)",
      ...merged.map((m) => m.totalLoad),
      sum(merged.map((m) => m.totalLoad)),
    ];

    const rowGas = [
      "Gas BTU Consumption (BTU/h)",
      ...merged.map((m) => m.gasBTU),
      sum(merged.map((m) => m.gasBTU)),
    ];

    const rowColdWater = [
      "Water Consumption (Liters)",
      ...merged.map((m) => m.coldLiters),
      sum(merged.map((m) => m.coldLiters)),
    ];

    const rowHotWater = [
      "Water Consumption (Liters)",
      ...merged.map((m) => m.hotLiters),
      sum(merged.map((m) => m.hotLiters)),
    ];

    const rowExhaust = [
      "Volume (m³/h)",
      ...merged.map((m) => m.exhaustM3h),
      sum(merged.map((m) => m.exhaustM3h)),
    ];

    const aoa = [
      header,
      modelRow,
      [],
      ["ELECTRICITY"],
      rowElectricity,
      [],
      ["GAS"],
      rowGas,
      [],
      ["COLD WATER"],
      rowColdWater,
      [],
      ["HOT WATER"],
      rowHotWater,
      [],
      ["EXHAUST"],
      rowExhaust,
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const colCount = header.length;
    ws["!cols"] = Array.from({ length: colCount }, (_, i) => ({
      wch: i === 0 ? 30 : 20,
    }));

    const setCell = (addr, s) => {
      if (ws[addr]) ws[addr].s = { ...(ws[addr].s || {}), ...s };
    };
    const address = (r, c) => XLSX.utils.encode_cell({ r, c });

    const border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    const blueHdr = {
      font: { bold: true },
      alignment: { horizontal: "center" },
      fill: { fgColor: { rgb: "D9E1F2" } },
      border,
    };
    const sectionBlue = {
      fill: { fgColor: { rgb: "DAEEF3" } },
      font: { bold: true },
      border,
    };
    const yellowRow = { fill: { fgColor: { rgb: "FFF2CC" } }, border };
    const redTotal = { font: { bold: true, color: { rgb: "C00000" } } };

    // Header styling
    for (let c = 0; c < colCount; c++) setCell(address(0, c), blueHdr);
    for (let c = 0; c < colCount; c++)
      setCell(address(1, c), { font: { bold: true }, border });

    // Section titles rows
    const secRows = [3, 6, 9, 12, 15];
    secRows.forEach((r) => {
      for (let c = 0; c < colCount; c++) setCell(address(r, c), sectionBlue);
      ws["!merges"] = ws["!merges"] || [];
      ws["!merges"].push({ s: { r, c: 0 }, e: { r, c: colCount - 1 } });
    });

    // Metric rows (immediately after each section)
    const metricRows = [4, 7, 10, 13, 16];
    metricRows.forEach((r) => {
      for (let c = 0; c < colCount; c++) setCell(address(r, c), yellowRow);
      setCell(address(r, colCount - 1), redTotal);
    });

    // Borders for all existing cells
    for (let r = 0; r < aoa.length; r++) {
      for (let c = 0; c < colCount; c++) {
        const a = address(r, c);
        if (ws[a]) setCell(a, { border });
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consumption");
    XLSX.writeFile(wb, `cart-${cartId}.xlsx`);
    toast.success("Exported (.xlsx) with machines as columns");
  } catch (e) {
    console.error(e);
    toast.error("Failed to export XLSX");
  }
};


  if (!user) return <div className="p-6 animate-pulse space-y-4">
    <div className="h-8 w-1/3 bg-gray-300 rounded"></div>
    <div className="h-6 w-1/2 bg-gray-300 rounded"></div>
  </div>;

  if (!cart) return <div className="p-6 animate-pulse space-y-4">
    <div className="h-8 w-1/2 bg-gray-300 rounded"></div>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-6 w-full bg-gray-200 rounded"></div>
    ))}
  </div>;
const COLORS = {
  currency: {
    electricity: "#4f46e5", // Indigo
    gas: "#f97316",         // Orange
    waterCold: "#0284c7",   // Dark Blue
    waterHot: "#b91c1c",    // Dark Red
  },
  usage: {
    electricity: "#6366f1", // Lighter Indigo
    gasWasher: "#facc15",   // Yellow
    gasDryer: "#84cc16",    // Lime
    gasIroner: "#22c55e",   // Green
    waterCold: "#38bdf8",   // Light Blue
    waterHot: "#ef4444",    // Light Red
  }
};

  return (
    <div className="p-5 rounded-2xl shadow-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-shadow duration-300">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-bold mb-4">Machine Details & Cost Analysis</h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Operating Hours */}
          <div className="flex flex-col space-y-1">
            <label className="font-medium text-gray-700">Operating Hours</label>
            <input
              type="number"
              value={hour}
              min="1"
              max="12"
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-32 rounded-lg border-gray-300 shadow-sm 
                        focus:border-blue-500 focus:ring focus:ring-blue-200 
                        px-3 py-2 text-sm"
            />
          </div>

          <UserRatesInput
            categoryRates={categoryRates}
            setCategoryRates={setCategoryRates}
            items={items}
            setItems={setItems}
            hour={hour}
          />




          {/* Actions */}
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={saveCart}
              disabled={loading}
              className={`flex items-center justify-center gap-2 rounded-md px-6 py-2 text-white transition duration-300
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {loading ? "Saving..." : "Save Cart"}
            </button>

            <button
              onClick={soon}
              className="flex items-center justify-center gap-2 rounded-md px-6 py-2 bg-green-700 text-white shadow hover:bg-green-800 transition duration-300"
            >
              Export to Excel (.xlsx)
            </button>
            <button
              onClick={() => router.push("/compute")}
              className="flex items-center justify-center gap-2 rounded-md px-6 py-2 bg-gray-700 text-white shadow hover:bg-gray-800 transition duration-300"
            >
              Back
            </button>
          </div>
        </div>

      {/* Right column - Charts */}
      <div className="lg:col-span-2 space-y-6">
        {/* Toggle buttons */}
        <div className="flex justify-center gap-2 mb-2">
          <button
            onClick={() => setViewMode("currency")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewMode === "currency"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Currency
          </button>
          <button
            onClick={() => setViewMode("usage")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewMode === "usage"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Usage
          </button>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="font-semibold text-lg mb-2 text-center">
            {viewMode === "currency" ? "Total Cost Distribution" : "Total Usage Distribution"}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
            <Pie
              data={viewMode === "currency"
                ? [
                    { name: "Electricity", value: totals.electricity, fill: COLORS.currency.electricity },
                    { name: "Gas", value: totals.gas, fill: COLORS.currency.gas },
                    { name: "Cold Water", value: totals.waterCold, fill: COLORS.currency.waterCold },
                    { name: "Hot Water", value: totals.waterHot, fill: COLORS.currency.waterHot },
                  ]
                : [
                    { name: "Electricity", value: totals.rawElectricity, fill: COLORS.usage.electricity },
                    { name: "Gas - Washer", value: totals.rawGasHotWater, fill: COLORS.usage.gasWasher },
                    { name: "Gas - Dryer", value: totals.rawGasDryer, fill: COLORS.usage.gasDryer },
                    { name: "Gas - Ironer", value: totals.rawGasIroner, fill: COLORS.usage.gasIroner },
                    { name: "Cold Water", value: totals.rawColdWater, fill: COLORS.usage.waterCold },
                    { name: "Hot Water", value: totals.rawHotWater, fill: COLORS.usage.waterHot },
                  ]
              }
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) =>
                viewMode === "currency"
                  ? `${entry.name}: ${formatCurrency(entry.value)}`
                  : `${entry.name}: ${entry.value.toFixed(2)}`
              }
            />
              <Tooltip
                formatter={(value) =>
                  viewMode === "currency" ? formatCurrency(value) : value.toFixed(2)
                }
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="font-semibold text-lg mb-2 text-center">
            {viewMode === "currency" ? "Cost per Machine" : "Usage per Machine"}
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis
                label={{
                  value: viewMode === "currency" ? "Cost (₱)" : "Usage (kWh /m³/ kg)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (viewMode === "currency") return [formatCurrency(value), name];
                  if (name.includes("Electricity")) return [`${value.toFixed(2)} kWh`, name];
                  if (name.includes("Water")) return [`${value.toFixed(2)} m³`, name];
                  if (name.includes("Gas")) return [`${value.toFixed(2)} kg`, name];
                  return value;
                }}
              />
              <Legend />

            {viewMode === "currency" ? (
              <>
                <Bar dataKey="electricity" fill={COLORS.currency.electricity} name="Electricity Cost" />
                <Bar dataKey="gas" fill={COLORS.currency.gas} name="Gas Cost" />
                <Bar dataKey="waterCold" fill={COLORS.currency.waterCold} name="Cold Water Cost" />
                <Bar dataKey="waterHot" fill={COLORS.currency.waterHot} name="Hot Water Cost" />
              </>
            ) : (
              <>
                <Bar dataKey="rawElectricity" fill={COLORS.usage.electricity} name="Electricity Usage" />
                <Bar dataKey="rawGasHotWater" fill={COLORS.usage.gasWasher} name="Washer Gas Usage" />
                <Bar dataKey="rawGasDryer" fill={COLORS.usage.gasDryer} name="Dryer Gas Usage" />
                <Bar dataKey="rawGasIroner" fill={COLORS.usage.gasIroner} name="Ironer Gas Usage" />
                <Bar dataKey="rawColdWater" fill={COLORS.usage.waterCold} name="Cold Water Usage" />
                <Bar dataKey="rawHotWater" fill={COLORS.usage.waterHot} name="Hot Water Usage" />
              </>
            )}

            </BarChart>
          </ResponsiveContainer>
          
        </div>
         {/* Totals */}
          <div className="p-4 border rounded bg-gray-50 shadow-sm">
            <h2 className="font-bold text-lg mb-4 text-gray-800">
              Total Cost and Consumption per Day
            </h2>

            {/* Horizontal layout for Energy and Water */}
            <div className="flex flex-wrap gap-6">
              {/* Energy Section */}
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-medium text-gray-700 mb-2">Energy</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Electricity */}
                  <div>
                    <p className="font-medium">Electricity</p>
                    <p className="text-gray-900">{formatCurrency(totals.electricity)}</p>
                    <p className="text-xs text-gray-500">
                      Usage: {totals.rawElectricity.toFixed(2)} kWh
                    </p>
                  </div>

                  {/* Gas */}
                  <div>
                    <p className="font-medium">Gas</p>
                    <p className="text-gray-900">{formatCurrency(totals.gas)}</p>
                    <p className="text-xs text-gray-500">
                      Dryer: {totals.rawGasDryer.toFixed(2)} kg
                    </p>
                    <p className="text-xs text-gray-500">
                      Ironer: {totals.rawGasIroner.toFixed(2)} kg
                    </p>
                  </div>
                </div>
              </div>

              {/* Water Section */}
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-medium text-gray-700 mb-2">Water</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Cold Water */}
                  <div>
                    <p className="font-medium">Cold Water</p>
                    <p className="text-gray-900">{formatCurrency(totals.waterCold)}</p>
                    <p className="text-xs text-gray-500">
                      Usage: {totals.rawColdWater.toFixed(2)} m³
                    </p>
                  </div>

                  {/* Hot Water */}
                  <div>
                    <p className="font-medium">Hot Wash</p>
                    <p className="text-gray-900">{formatCurrency(totals.waterHot)}</p>
                    <p className="text-xs text-gray-500">
                      Usage: {totals.rawHotWater.toFixed(2)} m³ • Gas: {totals.rawGasHotWater.toFixed(2)} kg
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grand Total */}
            <div className="mt-4 p-2 bg-green-50 text-green-800 font-bold rounded text-center">
              Grand Total (per Day):{" "}
              {formatCurrency(
                totals.electricity + totals.gas + totals.waterCold + totals.waterHot
              )}
            </div>
          </div>


      </div>
      
      </div>
      
    </div>
  );
}
