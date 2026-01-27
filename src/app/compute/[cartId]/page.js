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
const TIME_LOAD = 0.17;
const LPG_TANK_KG = 50; // kilograms per LPG tank
const LPG_COST_PER_TANK = 4000; // PHP per 50kg tank

const DAYS_PER_MONTH = 30;   // standard estimate

const MONTHS_PER_YEAR = 12;
//const DAYS_PER_YEAR = 365;

// Calculate KGS/HR from BTU/HR using formula: BTU/HR / (47654.2 * 10)
const getGasKgPerHour = (btu = 0) =>
  btu / (BTU_TO_KG_GAS * 10);

/**
 * Converts BTU/hr to kg of LPG per load
 * @param {number} btuPerHr - machine BTU/hr rating
 * @param {number} hoursPerLoad - load duration in hours
 */
const getGasKgPerLoad = (btuPerHr = 0, hoursPerLoad = TIME_LOAD) =>
  getGasKgPerHour(btuPerHr) * hoursPerLoad;


const COLORS = ["#4f46e5", "#f97316", "#0ea5e9", "#f43f5e"];

export default function CartDetailPage() {
  const { user } = useAuth(); 
  const params = useParams();
  const router = useRouter();
  const cartId = params.cartId;

  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [hour, setHour] = useState(0);
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

  const normalizeCategory = (category = "") => category.toUpperCase().trim();

const isWasher = (cat) => cat.includes("WASHER");
const isDryer = (cat) => cat.includes("DRYER");
const isIroner = (cat) => cat.includes("IRONER");
const isWaterHeater = (cat) =>
  cat.includes("WATER HEATERS") || cat.includes("WATERHEATERS");

  const calculateCostPerLoad = useCallback(
    (machine) => {

      
      const qty = machine.quantity || 0;
      if (!qty || !hour)
        return { 
          electricity: 0, 
          waterCold: 0, 
          waterHot: 0, 
          gas: 0, 
          rawGasHotWater: 0,
          kwPerMachine: 0,
          kwTotal: 0
        };

const cat = normalizeCategory(machine.category);
const ratesKey =
  isWasher(cat)
    ? `washer_${machine.category}`
    : isDryer(cat)
    ? `dryer_${machine.category}`
    : isIroner(cat)
    ? `ironers_${machine.category}`
    : isWaterHeater(cat)
    ? `waterheater_${machine.category}`
    : machine.category;


      const rates = categoryRates[ratesKey] || {};

      // Use ironer-specific hours and water heater specific hours if available for ironers, otherwise use general hour
const operatingHours =
  isIroner(cat) && categoryRates.ironer_hours
    ? categoryRates.ironer_hours
    : isWaterHeater(cat) && categoryRates.waterheater_hours
    ? categoryRates.waterheater_hours
    : hour;


      // Electricity: KW TOTAL = KW per machine × quantity
      // Use aveElecConsump instead of totalLoad for electricity calculation
// Electricity
const kwPerMachine = parseFloat(machine.aveElecConsump) || 0; // kW per machine per hour
const kwTotal = kwPerMachine * qty; // kW for all machines of this type

const operatingHoursSafe = parseFloat(operatingHours) || 0;
const rawElectricity = kwTotal * operatingHoursSafe; // kWh per day
const electricityCost = rawElectricity * (parseFloat(rates.electricity) || 0); // PHP per day
 // kWh per day for usage display

      // Water
      const coldUsage =
        cat.includes("WASHER")
          ? ((parseFloat(machine.coldWater?.waterConsump) || 0) / 1000) * qty * operatingHours
          : 0;
      const hotUsage =
        cat.includes("WASHER")
          ? ((parseFloat(machine.hotWater?.waterConsump) || 0) / 1000) * qty * operatingHours
          : 0;

          const waterRate = parseFloat(rates.water) || 0;

      // Gas
      let gasUsage = 0;
      let rawGasHotWater = 0;
      let rawGasDryer = 0;
      let rawGasIroner = 0;
      let rawGasWaterHeater = 0;
      let dryerGasPerDay = 0;
      let ironerGasPerDay = 0;
      let waterHeaterGasPerDay = 0;
      let washerGasPerLoad = 0;

      let waterHeaterGasPerLoad = 0;
      let waterHeaterKgPerHour = 0;

let washerGasPerDay = 0;
let washerGasCostPerLoad = 0;
let washerGasCostPerDay = 0;

if (isWasher(cat) && machine.hotWater?.waterConsump) {
  washerGasPerLoad =
    ((parseFloat(machine.hotWater.waterConsump) || 0) *
      8.34 *
      HOT_WATER_TEMP_RISE) /
    BTU_TO_KG_GAS;

  washerGasPerDay = washerGasPerLoad * qty * operatingHours;
  washerGasCostPerLoad = washerGasPerLoad * (rates.gas || 0);
  washerGasCostPerDay = washerGasPerDay * (rates.gas || 0);

  rawGasHotWater = washerGasPerDay;
  gasUsage = washerGasPerDay;
} else if (isDryer(cat)) {
        // Dryer: KGS/HR * qty * operatingHours for daily consumption
        const dryerKgPerHour = getGasKgPerHour(parseFloat(machine.gasBTU) || 0);
        rawGasDryer = dryerKgPerHour * qty * operatingHours;
        const dryerGasPerDay =
  getGasKgPerLoad(parseFloat(machine.gasBTU) || 0, operatingHours) * qty;

        gasUsage = dryerGasPerDay;
      } else if (isIroner(cat)) {
        // Ironer: KGS/HR * qty * operatingHours for daily consumption (respects ironer-specific hours)
        const ironerKgPerHour = getGasKgPerHour(parseFloat(machine.gasBTU) || 0);
        rawGasIroner = ironerKgPerHour * qty * operatingHours;
const ironerGasPerDay =
  getGasKgPerLoad(parseFloat(machine.gasBTU) || 0, operatingHours) * qty;
        gasUsage = ironerGasPerDay;
} else if (isWaterHeater(cat)) {
  const btuPerHr = parseFloat(machine.gas?.btuConsumption) || parseFloat(machine.gasBTU) || 0;
  
  // ✅ assign to waterHeaterKgPerHour
  waterHeaterKgPerHour = getGasKgPerHour(btuPerHr);

  // daily gas for all units
  waterHeaterGasPerDay = waterHeaterKgPerHour * qty * operatingHours;

  // gas per load
  const totalWHLoads = qty * operatingHours;
  waterHeaterGasPerLoad = totalWHLoads ? waterHeaterGasPerDay / totalWHLoads : 0;

  // add to totals
  gasUsage = waterHeaterGasPerDay;
  rawGasWaterHeater = waterHeaterGasPerDay;
}




      
// let washerGasPerLoad = 0;
// let washerGasPerDay = 0;
// let washerGasCostPerLoad = 0;
// let washerGasCostPerDay = 0;

// if (cat.includes("WASHER") && machine.hotWater?.waterConsump) {
//   washerGasPerLoad =
//     ((parseFloat(machine.hotWater.waterConsump) || 0) *
//       8.34 *
//       HOT_WATER_TEMP_RISE) /
//     47654.2;

//   washerGasPerDay = washerGasPerLoad * qty * operatingHours;
//   washerGasCostPerLoad = washerGasPerLoad * (rates.gas || 0);
//   washerGasCostPerDay = washerGasPerDay * (rates.gas || 0);
// }


      return {
        electricity: electricityCost, // Total cost per day = Cost per load × operating hours
        waterCold: coldUsage * (rates.water || 0),
        waterHot: hotUsage * (rates.water || 0),
        gas: gasUsage * (rates.gas || 0),

        // Electricity breakdown
        kwPerMachine,
        kwTotal, // KW TOTAL = KW × QTY (for summing all machines)

        washerGasPerLoad,
        washerGasPerDay,
        washerGasCostPerLoad,
        washerGasCostPerDay,

        dryerGasPerDay,
        ironerGasPerDay,

        waterHeaterGasPerLoad,
        waterHeaterKgPerHour,
        waterHeaterGasPerDay,

        rawElectricity,
        rawGasHotWater,
        rawGasDryer,
        rawGasIroner,
        rawGasWaterHeater,
        rawColdWater: coldUsage,
        rawHotWater: hotUsage,
      };


    },
    [hour, categoryRates]
  );

  const totalGasPerDay = items.reduce((sum, machine) => {
  const cost = calculateCostPerLoad(machine, hour, categoryRates);
  return sum + (cost.gas || 0);
}, 0);

console.log("Total Gas Cost per Day:", formatCurrency(totalGasPerDay));


  const totalWasherLoads = useMemo(() => {
  return items.reduce((sum, m) => {
    if (!m.category?.toUpperCase().includes("WASHER")) return sum;
    return sum + (m.quantity || 0) * (hour || 0);
  }, 0);
}, [items, hour]);


  // Grand totals
    const totals = useMemo(() => {
      return items.reduce(
        (acc, m) => {
          const c = calculateCostPerLoad(m);
          acc.electricity += c.electricity;
          acc.waterCold += c.waterCold;
          acc.waterHot += c.waterHot;
          acc.gas += c.gas;

          // Sum up KW TOTAL for all machines
          acc.kwTotal += c.kwTotal || 0;

acc.washerGasPerDay += c.washerGasPerDay || 0;
acc.washerGasCostPerDay += c.washerGasCostPerDay || 0;

          acc.rawElectricity += c.rawElectricity;
          acc.rawGasHotWater += c.rawGasHotWater;
          acc.rawGasDryer += c.rawGasDryer;
          acc.rawGasIroner += c.rawGasIroner; // ✅
          acc.dryerGasPerDay += c.dryerGasPerDay || 0;
          acc.ironerGasPerDay += c.ironerGasPerDay || 0;
          
acc.rawGasWaterHeater += c.rawGasWaterHeater || 0;
acc.waterHeaterGasPerLoad += c.waterHeaterGasPerLoad || 0;
acc.waterHeaterGasPerDay += c.waterHeaterGasPerDay || 0;

          acc.rawColdWater += c.rawColdWater;
          acc.rawHotWater += c.rawHotWater;
          return acc;
        },
        { 
          electricity: 0, 
          waterCold: 0, 
          waterHot: 0, 
          gas: 0,

          // Total KW across all machines
          kwTotal: 0,

          washerGasPerDay: 0,
          washerGasCostPerDay: 0,

          dryerGasPerDay: 0,
          ironerGasPerDay: 0,

          rawElectricity: 0, 
          rawGasHotWater: 0,
          rawGasDryer: 0, 
          rawGasIroner: 0, // ✅ initialize
          rawGasWaterHeater: 0,

          waterHeaterGasPerLoad: 0,
          waterHeaterGasPerDay: 0,
          rawColdWater: 0, 
          rawHotWater: 0,
        }
      );
    }, [items, calculateCostPerLoad]);

    const totalWaterCost = totals.waterCold + totals.waterHot;
    const totalWaterUsage = totals.rawColdWater + totals.rawHotWater;

    const perDay = totals.electricity + totals.gas + totalWaterCost;

    const totalPerDay = {
    electricity: totals.electricity,
    gas: totals.gas,
    water: totalWaterCost,
    }

    const perMonth = {
    electricity: totalPerDay.electricity * DAYS_PER_MONTH,
    gas: totalPerDay.gas * DAYS_PER_MONTH,
    water: totalPerDay.water * DAYS_PER_MONTH,
    }

    const totalPerMonth = perMonth.electricity + perMonth.gas + perMonth.water;

    const perYear = {
    electricity: perMonth.electricity * MONTHS_PER_YEAR,
    gas: perMonth.gas * MONTHS_PER_YEAR,
    water: perMonth.water * MONTHS_PER_YEAR,
    };

    const totalPerYear = perYear.electricity + perYear.gas + perYear.water;

  // Pie chart data
  const pieData = useMemo(() => [
    { name: "Electricity", value: totals.electricity },
    { name: "Gas", value: totals.gas },
  { name: "Water (Total)", value: totalWaterCost },
  ], [totals, totalWaterCost]);

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
      rawGasIroner: c.rawGasIroner,
      rawGasWaterHeater: c.rawGasWaterHeater || 0,
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
      return "-";
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
    gasBTU:
    Number(m.gas?.btuConsumption) ||
    Number(m.gasBTU) ||
    0,
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
                      ...(totals.rawGasWaterHeater > 0 ? [{ name: "Gas - Water Heater", value: totals.rawGasWaterHeater, fill: COLORS.usage.gasWaterHeater || "#10b981" }] : []),
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
                {barData.some(d => d.rawGasWaterHeater > 0) && (
                  <Bar dataKey="rawGasWaterHeater" fill="#10b981" name="Water Heater Gas Usage" />
                )}
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
                    <p className="text-xs text-gray-600 font-semibold mt-1">
                      Total KW: {totals.kwTotal?.toFixed(2) || "0.00"} kW
                    </p>
                    {/* Detailed breakdown per machine */}
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
                      <p className="text-gray-600 font-semibold mb-1">Breakdown:</p>
                      {items.map((m) => {
                        const kwPerMachine = parseFloat(m.aveElecConsump) || 0;
                        const qty = m.quantity || 0;
                        const kwTotal = kwPerMachine * qty;
                        return (
                          <p key={m.id} className="text-gray-500">
                            {m.model}: {kwPerMachine.toFixed(2)} kW × {qty} = <strong>{kwTotal.toFixed(2)} kW</strong>
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gas */}
                  <div>
                    <p className="font-medium">Gas</p>
                    <p className="text-gray-900">{formatCurrency(totals.gas)}</p>

                    {/* Washer */}
                    <p className="text-xs text-gray-500">
                      Washer: {totals.rawGasHotWater.toFixed(2)} kg / day
                    </p>
                    <p className="text-xs text-gray-500 pl-3">
                      • Gas / load: {totalWasherLoads > 0
                      ? (totals.washerGasPerDay / totalWasherLoads).toFixed(3)
                      : "0.00"}kg
                    </p>

                    {/* Dryer */}
                    <p className="text-xs text-gray-500 mt-1">
                      Dryer: {totals.rawGasDryer.toFixed(2)} kg / day
                    </p>

                    {/* Ironer */}
                    <p className="text-xs text-gray-500">
                      Ironer: {totals.rawGasIroner.toFixed(2)} kg / day
                    </p>
                    {/* Water Heater */}
                    {totals.rawGasWaterHeater > 0 && (
                      <p className="text-xs text-gray-500">
    Water Heater: {totals.rawGasWaterHeater.toFixed(2)} kg / day
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* Water Section */}

<div className="flex-1 min-w-[200px]">
  <h3 className="font-medium text-gray-700 mb-2">Water</h3>

  {/* TOTAL WATER */}
  <div className="mb-2">
    <p className="font-medium text-gray-900">
      {formatCurrency(totalWaterCost)}
    </p>
    <p className="text-xs text-gray-500">
      Usage: {(totalWaterUsage).toFixed(2)} m³
    </p>
  </div>

  {/* BREAKDOWN */}
  <div className="grid grid-cols-2 gap-4 text-sm border-t pt-2">
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
      <p className="font-medium">Hot Water</p>
      <p className="text-gray-900">{formatCurrency(totals.waterHot)}</p>
      <p className="text-xs text-gray-500">
        Usage: {totals.rawHotWater.toFixed(2)} m³
        {totals.rawGasHotWater > 0 && (
          <> • Gas: {totals.rawGasHotWater.toFixed(2)} kg</>
        )}
      </p>
    </div>
  </div>
</div>

            </div>

            {/* Grand Total */}
            <div className="mt-4 p-2 bg-green-50 text-green-800 font-bold rounded text-center">
  {/* Per Day */}
  <div className="p-2 bg-green-50 text-green-800 font-bold rounded text-center">
    Total Cost per Day: {formatCurrency(perDay)}
  </div>
            </div>

            <div className="p-4 border rounded bg-blue-50 shadow-sm">
  <h2 className="font-bold text-lg mb-3 text-blue-900">
    Total Cost per Month (by Utility)
  </h2>

  <div className="grid grid-cols-3 gap-4 text-sm">
    <div>
      <p className="font-medium">Electricity</p>
      <p className="text-gray-900">{formatCurrency(perMonth.electricity)}</p>
    </div>

    <div>
      <p className="font-medium">Gas</p>
      <p className="text-gray-900">{formatCurrency(perMonth.gas)}</p>
    </div>

    <div>
      <p className="font-medium">Water</p>
      <p className="text-gray-900">{formatCurrency(perMonth.water)}</p>
    </div>

  </div>

  <p className="text-xs text-gray-600 mt-2">
    Based on 30 operating days per month
  </p>
  <div className="p-2 bg-green-50 text-green-800 font-bold rounded text-center">
    Total Cost per Month: {formatCurrency(totalPerMonth)}
  </div>
</div>

<div className="p-4 border rounded bg-purple-50 shadow-sm">
  <h2 className="font-bold text-lg mb-3 text-purple-900">
    Total Cost per Year (by Utility)
  </h2>

  <div className="grid grid-cols-3 gap-4 text-sm">
    <div>
      <p className="font-medium">Electricity</p>
      <p className="text-gray-900">{formatCurrency(perYear.electricity)}</p>
    </div>

    <div>
      <p className="font-medium">Gas</p>
      <p className="text-gray-900">{formatCurrency(perYear.gas)}</p>
    </div>

    <div>
      <p className="font-medium">Water</p>
      <p className="text-gray-900">{formatCurrency(perYear.water)}</p>
    </div>
  </div>

  <p className="text-xs text-gray-600 mt-2">
    Based on 365 operating days per year
  </p>

    <div className="p-2 bg-green-50 text-green-800 font-bold rounded text-center">
    Total Cost per Year: {formatCurrency(totalPerYear)}
  </div>
</div>

          </div>


      </div>
      
      </div>
      
    </div>
  );
}
