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
import { m } from "framer-motion";

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
      toast.success("✅ Cart saved successfully!");
    } catch (error) {
      console.error("Error saving cart:", error);
      toast.error("❌ Failed to save cart. Try again.");
    } finally {
      setLoading(false);
    }
  };


    const pickSupplyHeight = (m) => {
    if (["TUMBLE DRYER", "IRONERS"].includes(m.category)) {
      return m.gasSupplyHeight ?? "-";
    }
    return m.supplyHeight ?? "-";
  };

    const getGasConnectionHeight = (m) => {
      if (["IRONERS", "TUMBLE DRYER"].includes(m.category)) {
        return m.gasConnectionHeight ?? m.connectionHeight ?? "-";
      }
    };


const getConnectionHeight = (m) => {
  if (m.category === "IRONERS") {
    return m.current ?? "-";
  }
  return m.connectionHeight ?? "-";
};

// Expand machines by quantity
const expandedMachines = [];
(items || []).forEach((m, i) => {
  const qty = Number(m.quantity || 1); // assume you store machine quantity here
  for (let q = 0; q < qty; q++) {
    expandedMachines.push({
      ...m,
      name: `${m.model || `Machine ${i + 1}`} ${qty > 1 ? `(Unit ${q + 1})` : ""}`,
    });
  }
});



// XLSX export: single sheet, columns per machine + Total column
const exportToXLSX = async () => {
  try {
    const XLSX = await import("xlsx-js-style");
    
   // ✅ Expand machines by quantity
    const expandedMachines = [];
    (items || []).forEach((m, i) => {
      const qty = Number(m.quantity || 1);
      for (let q = 0; q < qty; q++) {
        expandedMachines.push({
          ...m,
          name: `${m.model || `Machine ${i + 1}`} ${qty > 1 ? `(Unit ${q + 1})` : ""}`,
        });
      }
    });
    
    // ✅ Build machine objects
    const machines = expandedMachines.map((m, i) => ({
      name: (m.model || `Machine ${i + 1}`).toString(),
      gForce: Number(m.gFactor || 0),
      category: (m.category || "-").toString(),
      heatSource: (m.heatSource || "-").toString(),
      totalLoad: Number(m.totalLoad || 0),
      gasBTU: Number(m.gasBTU || 0),
      coldLiters: Number(m?.coldWater?.waterConsump || 0),
      hotLiters: Number(m?.hotWater?.waterConsump || 0),
      exhaustM3h: Number(m.volumeFlow || 0),
      weight: Number(m.weight || 0),
      height: Number(m.height || 0),
      width: Number(m.width || 0),
      depth: Number(m.depth || 0),
      voltage: m.voltage || "-",
      recommendedFuse: m.recommendedFuse || "-",
      connectionHeight: getConnectionHeight(m),
      supplyWaterHeight: m.supplyWaterHeight || "-",
      supplyHeight: pickSupplyHeight(m) ?? m.supplyHeight,
      connectionType: m.connectionType || "-",
      gasLoad: Number(m.gasLoad || 0),
      diameter: m.diameter ?? m.diameterFlow ?? "-",
      gasPressure: m.gasPressure || "-",
      gasType: m.gasType || "-",

      gasConnectionHeight: getGasConnectionHeight(m),

      gasSupplyHeight: m.gasSupplyHeight || "-",
      coldWater: m.coldWater || {},
      hotWater: m.hotWater || {},
      drain: m.drain || {},
      pressureDrop: m.pressureDrop || "-",
    }));

    // // Merge duplicates by name
    // const machineMap = {};
    // machines.forEach((m) => {
    //   if (!machineMap[m.name]) {
    //     machineMap[m.name] = { ...m };
    //     machineMap[m.category] = { ...m };
    //   } else {
    //     machineMap[m.name].totalLoad += m.totalLoad;
    //     machineMap[m.name].gasBTU += m.gasBTU;
    //     machineMap[m.name].coldLiters += m.coldLiters;
    //     machineMap[m.name].hotLiters += m.hotLiters;
    //     machineMap[m.name].exhaustM3h += m.exhaustM3h;
    //     machineMap[m.name].weight += m.weight;
    //     machineMap[m.name].height += m.height;
    //     machineMap[m.name].width += m.width;
    //     machineMap[m.name].depth += m.depth;
    //     machineMap[m.name].gasLoad += m.gasLoad;
    //   }
    // });
    // const merged = Object.values(machineMap);

    // ✅ Utility
    const sum = (arr) =>
      arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

    // ✅ Section + row configs
    const sections = [
      {

        title: "DIMENSIONS",
        rows: [
          { label: "Weight (kg)", key: "weight", sum: false },
          { label: "Height (cm)", key: "height", sum: false },
          { label: "Width (cm)", key: "width", sum: false },
          { label: "Depth (cm)", key: "depth", sum: false },
        ],
      },
      {
        title: "ELECTRICITY",
        rows: [
          { label: "Voltage/Frequency/Phase", key: "voltage", sum: false },
          { label: "Fuse (Amps)", key: "recommendedFuse", sum: false },
          { label: "Height of Connection (mm)", key: "connectionHeight", sum: false },
          { label: "Suggested Supply Height (cm)", key: "supplyHeight", sum: false },
          { label: "Type of Connection", key: "connectionType", sum: false },
          { label: "Average Consumption (kW)", key: "totalLoad", sum: true },
        ],
      },
      {
        title: "GAS",
        rows: [
          { label: "Diameter", key: "diameter", sum: false },
          { label: "Gas Pressure (mbar)", key: "gasPressure", sum: false },
          { label: "Type of Gas", key: "gasType", sum: false },
          { label: "Height of Connection (mm)", key: "gasConnectionHeight", sum: false },
          { label: "Suggested Supply Height (cm)", key: "gasSupplyHeight", sum: false },
          { label: "Gas BTU Consumption (BTU/h)", key: "gasBTU", sum: true },
          { label: "Gas Load (kW)", key: "gasLoad", sum: true },
        ],
      },
      {
        title: "COLD WATER",
        rows: [
          { label: "Diameter", key: "coldWater.diameter", sum: false },
          { label: "Height of Connection (mm)", key: "coldWater.connectionHeight", sum: false },
          { label: "Suggested Supply Height (cm)", key: "coldWater.supplyWaterHeight", sum: false },
          { label: "Minimum Pressure (kpa)", key: "coldWater.minPressure", sum: false },
          { label: "Maximum Pressure (kpa)", key: "coldWater.maxPressure", sum: false },
          { label: "Water Consumption (Liters)", key: "coldLiters", sum: true },
        ],
      },
      {
        title: "HOT WATER",
        rows: [
          { label: "Diameter", key: "hotWater.diameter", sum: false },
          { label: "Height of Connection (mm)", key: "hotWater.connectionHeight", sum: false },
          { label: "Suggested Supply Height (cm)", key: "hotWater.supplyWaterHeight", sum: false },
          { label: "Minimum Pressure (kpa)", key: "hotWater.minPressure", sum: false },
          { label: "Maximum Pressure (kpa)", key: "hotWater.maxPressure", sum: false },
          { label: "Water Consumption (Liters)", key: "hotLiters", sum: true },
        ],
      },
      {
        title: "DRAIN",
        rows: [
          { label: "Drain Connection Height (cm)", key: "drain.connectionHeight", sum: false },
          { label: "Drain Diameter(mm)", key: "drain.diameter", sum: false },
          { label: "Suggested Drain Height (cm)", key: "drain.supplyHeight", sum: false },
        ],
      },
      {
        title: "EXHAUST",
        rows: [
          { label: "Diameter", key: "diameter", sum: false },
          { label: "Pressure Drop (Pa)", key: "pressureDrop", sum: false },
          { label: "Volume (m³/h)", key: "exhaustM3h", sum: false },
        ],
      },
    ];

    // ✅ Header rows
    const header = ["Type", ...machines.map((m) => m.category), "Total Consumption"];
    const modelRow = ["Model", ...machines.map((m) => m.name), ""];
    const heatRow = ["Heat Source", ...machines.map((m) => m.heatSource), ""];
    const forcerRow = ["G-Force", ...machines.map((m) => m.gForce), ""];

    // ✅ Row builder
    const getValue = (obj, path) =>
      path.split(".").reduce((o, k) => (o ? o[k] : "-"), obj);

    const buildRow = ({ label, key, sum: doSum }) => {
      const values = machines.map((m) => getValue(m, key) ?? "-");
      const total = doSum
        ? sum(values.map((v) => (typeof v === "number" ? v : parseFloat(v) || 0)))
        : "";
      return [label, ...values, total];
    };

    // ✅ Assemble all rows
    const aoa = [header, modelRow, heatRow, forcerRow, []];
    sections.forEach((sec) => {
      aoa.push([sec.title]);
      sec.rows.forEach((row) => aoa.push(buildRow(row)));
      aoa.push([]);
    });

    // ✅ Create sheet
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const colCount = header.length;

    // Set column widths
    ws["!cols"] = Array.from({ length: colCount }, (_, i) => ({
      wch: i === 0 ? 30 : 20,
    }));

Object.keys(ws).forEach((cellAddr) => {
  if (cellAddr[0] === "!") return;

  if (!ws[cellAddr].s) ws[cellAddr].s = {};
  ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };

  // Make first row (headers) bold
  const row = parseInt(cellAddr.match(/\d+/)[0], 10); 
  if (row === 1) {
    ws[cellAddr].s.font = { bold: true };
  }
});


    // Styling (keep your existing cell styling logic here if needed)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consumption");
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const formattedDateTime = [
    now.getFullYear(),
    pad(now.getMonth() + 1), // month is 0-based
    pad(now.getDate())
  ].join("-") + "_" + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("-");

  //eg: cart-2025-09-25_11-57-00.xlsx

  XLSX.writeFile(wb, `MEP-${formattedDateTime}.xlsx`);

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
              onClick={exportToXLSX}
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
              data={
                viewMode === "currency"
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
              label={({ name, value, percent }) =>
                viewMode === "currency"
                  ? `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(1)}%)`
                  : `${name}: ${value.toFixed(2)} (${(percent * 100).toFixed(1)}%)`
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
