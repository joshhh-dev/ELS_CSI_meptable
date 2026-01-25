"use client";
import { useMemo } from "react";

// Helper to group items by category
const groupItemsByCategory = (items) =>
  items.reduce((groups, item) => {
    const category = item.category || "Other";
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {});

// Currency formatter
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

// Conversion constants
const BTU_TO_KG_GAS = 47654.2;
const GAS_EFFICIENCY = 0.6;
const TIME_LOAD = 0.17; // hours per load
const LPG_TANK_KG = 50; // kilograms per LPG tank
const LPG_COST_PER_TANK = 4000; // PHP per 50kg tank
const LPG_COST_PER_KG = LPG_COST_PER_TANK / LPG_TANK_KG; // PHP per kg (80)

// Calculate KGS/HR from BTU/HR using formula: BTU/HR / (47654.2 * 10)
const getGasKgPerHour = (btu = 0) => btu / (BTU_TO_KG_GAS * 10);

// Calculate KGS per load using TIME_LOAD
const getGasKgPerLoad = (btu = 0) => getGasKgPerHour(btu) * TIME_LOAD;

const normalizeCategory = (category = "") =>
  category.toUpperCase().trim();

const isWasherCat = (cat) => cat.includes("WASHER");
const isDryerCat = (cat) => cat.includes("DRYER");
const isIronerCat = (cat) => cat.includes("IRONER");
const isWaterHeaterCat = (cat) =>
  cat.includes("WATER HEATERS") || cat.includes("WATERHEATERS");

// Helper to get rate key based on category
const getRateKey = (category = "") => {
  const cat = normalizeCategory(category);

  if (isWasherCat(cat)) return `washer_${category}`;
  if (isDryerCat(cat)) return `dryer_${category}`;
  if (isIronerCat(cat)) return `ironers_${category}`;
  if (isWaterHeaterCat(cat)) return `waterheater_${category}`;

  return category;
};



// Helper to get applicable utilities based on category
const getUtilitiesByCategory = (category = "") => {
  const cat = normalizeCategory(category);

  if (isWasherCat(cat)) return ["electricity", "water"];
  if (isDryerCat(cat) || isIronerCat(cat)) return ["electricity", "gas"];
  if (isWaterHeaterCat(cat)) return ["gas"];

  return ["electricity", "water", "gas"];
};


export default function UserRatesInput({ categoryRates, setCategoryRates, items, setItems, hour }) {
  // Handle changes to utility rates inputs
    const handleRateChange = (categoryKey, key) => (e) => {
      const value = e.target.value;
      setCategoryRates((prev) => ({
        ...prev,
        [categoryKey]: {
          ...prev[categoryKey],
          [key]: value, // keep raw string
        },
      }));
    };

    const handleIronerHoursChange = (e) => {
      const value = e.target.value;
      setCategoryRates((prev) => ({
        ...prev,
        ironer_hours: value,
      }));
    };

    const handleWaterHeaterHoursChange = (e) => {
      const value = e.target.value;
      setCategoryRates((prev) => ({
        ...prev,
        waterheater_hours: value,
      }));
    }; 

    const handleIronerHoursBlur = (e) => {
      const num = parseFloat(e.target.value);
      setCategoryRates((prev) => ({
        ...prev,
        ironer_hours: isNaN(num) ? 0 : Math.max(0, num),
      }));
    };

      const handleWaterHeaterHoursBlur = (e) => {
      const num = parseFloat(e.target.value);
      setCategoryRates((prev) => ({
        ...prev,
        waterheater_hours: isNaN(num) ? 0 : Math.max(0, num),
      }));
    };

    const handleLpgCostChange = (e) => {
      const value = e.target.value;
      setCategoryRates((prev) => ({
        ...prev,
        lpg_cost_per_kg: value,
      }));
    };

    const handleLpgCostBlur = (e) => {
      const num = parseFloat(e.target.value);
      setCategoryRates((prev) => ({
        ...prev,
        lpg_cost_per_kg: isNaN(num) ? 80 : Math.max(0, num),
      }));
    };

    const handleRateBlur = (categoryKey, key) => (e) => {
      const num = parseFloat(e.target.value);
      setCategoryRates((prev) => ({
        ...prev,
        [categoryKey]: {
          ...prev[categoryKey],
          [key]: isNaN(num) ? 0 : Math.max(0, num),
        },
      }));
    };



  // Update machine quantity, enforcing minimum of 1
  const updateQuantity = (id, value) =>
    setItems((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, quantity: value } : m
      )
    );



  // Remove machine by id
  const removeMachine = (id) => setItems((prev) => prev.filter((m) => m.id !== id));

  // Calculate cost per load for a machine
  const calculateCostPerLoad = (machine) => {
    const qty = machine.quantity || 0;
    if (!qty || !hour) return { electricity: 0, waterCold: 0, waterHot: 0, gas: 0 };

    const catUpper = machine.category.toUpperCase();
    const ratesKey = getRateKey(machine.category);
    const rates = categoryRates[ratesKey] || {};

    // Use ironer-specific hours and water heater specific hours if available for ironers, otherwise use general hour
const isWasher = isWasherCat(catUpper);
const isDryer = isDryerCat(catUpper);
const isIroner = isIronerCat(catUpper);
const isWaterHeater = isWaterHeaterCat(catUpper);

  const operatingHours =
    (isIroner && categoryRates.ironer_hours) ||
    (isWaterHeater && categoryRates.waterheater_hours) ||
    hour;
  
    // Electricity: KW TOTAL = KW per machine × quantity
    // Use aveElecConsump instead of totalLoad for electricity calculation
    const kwPerMachine = parseFloat(machine.aveElecConsump) || 0;
    const kwTotal = kwPerMachine * qty; // Total KW = KW × QTY
    // Calculate electricity per day for cost calculation = KW TOTAL × operating hours
    const electricUsagePerDay = kwTotal * operatingHours;
const coldUsage =
  ((parseFloat(machine.coldWater?.waterConsump) || 0) / 1000) * qty;

const hotUsage =
  ((parseFloat(machine.hotWater?.waterConsump) || 0) / 1000) * qty;

const waterRate = parseFloat(rates.water) || 0;

// Gas cost per load
let gasCost = 0;
let washerGasCostPerLoad = 0;
let dryerGasKgPerHour = 0;
let dryerGasKgPerLoad = 0;
let ironerGasKgPerHour = 0;
let ironerGasKgPerLoad = 0;

// Washer: per-load kg × gas rate
if (isWasher) {
    washerGasCostPerLoad =
    ((parseFloat(machine.hotWater?.waterConsump) || 0) *
      8.34 *
      60) /
    BTU_TO_KG_GAS;

  const gasRate = parseFloat(rates.gas) || 0;
  gasCost = (washerGasCostPerLoad|| 0) * gasRate * qty;
}

// Dryer: Calculate KGS/HR and KGS per load using new formula
if (isDryer) {
  const btuPerHr = parseFloat(machine.gasBTU) || 0;
  dryerGasKgPerHour = getGasKgPerHour(btuPerHr);
  // For dryer: KGS per Load = KGS/HR * Qty
  dryerGasKgPerLoad = dryerGasKgPerHour * qty;
  const gasRate = parseFloat(rates.gas) || 0;
  gasCost = dryerGasKgPerLoad * gasRate;
}

// Ironer: Calculate KGS/HR and KGS per load 
if (isIroner) {
  const btuPerHr = parseFloat(machine.gasBTU) || 0;
  ironerGasKgPerHour = getGasKgPerHour(btuPerHr);
  // For ironer: KGS per Load = KGS/HR * Qty (per-load value)
  ironerGasKgPerLoad = ironerGasKgPerHour * qty;
  const gasRate = parseFloat(rates.gas) || 0;
  gasCost = ironerGasKgPerLoad * gasRate;
}

// Water Heater: Calculate KGS/HR and KGS per load
let waterHeaterGasKgPerHour = 0;
let waterHeaterGasKgPerLoad = 0;
if (isWaterHeater) {
  // Use gas.btuConsumption if available, otherwise fallback to gasBTU
  const btuPerHr = parseFloat(machine.gas?.btuConsumption) || parseFloat(machine.gasBTU) || 0;
  waterHeaterGasKgPerHour = getGasKgPerHour(btuPerHr);
  // For water heater: KGS per Load = KGS/HR * Qty
  waterHeaterGasKgPerLoad = waterHeaterGasKgPerHour * qty;
  const gasRate = parseFloat(rates.gas) || 0;
  gasCost = waterHeaterGasKgPerLoad * gasRate;
}

    return {
    electricity: kwTotal * (rates.electricity || 0),
    waterCold: isWasher ? coldUsage * waterRate : 0,
    waterHot: isWasher ? hotUsage * waterRate : 0,
    gas: gasCost,
    dryerGasKgPerHour,
    dryerGasKgPerLoad,
    ironerGasKgPerHour,
    ironerGasKgPerLoad,
    waterHeaterGasKgPerHour,
    waterHeaterGasKgPerLoad,
    };
  };

  // Memoize grouped items by category for performance
  const groupedItems = useMemo(() => groupItemsByCategory(items), [items]);

  const lpgCostPerKg = parseFloat(categoryRates.lpg_cost_per_kg) || 80;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Utility Rates & Machine Consumption</h2>

      {Object.entries(groupedItems).map(([category, machines]) => {
        const rateKey = getRateKey(category);
        const utilities = getUtilitiesByCategory(category);
        const isIronerCategory = category.toUpperCase().includes("IRONERS");
        const isWaterHeater = category.toUpperCase().includes("WATER HEATER") || category.toUpperCase().includes("WATERHEATER"); 

        return (
          <section
            key={category}
            className="p-5 rounded-2xl shadow-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-shadow duration-300"
            aria-labelledby={`category-${category}`}
          >
            <h3 id={`category-${category}`} className="text-lg font-semibold text-gray-800 mb-4">
              {category}
            </h3>

            {/* Ironer Operating Hours - only for Ironers category */}
            {isIronerCategory && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <label htmlFor="ironer-hours" className="flex flex-col text-sm font-medium text-gray-700">
                  Operating Hours (hours/day)
                  <input
                    id="ironer-hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={categoryRates.ironer_hours ?? ""}
                    onChange={handleIronerHoursChange}
                    onBlur={handleIronerHoursBlur}
                    className="mt-1 w-32 rounded-lg border-gray-300 shadow-sm
                               focus:border-indigo-500 focus:ring focus:ring-indigo-200 px-3 py-2 text-sm"
                    aria-describedby="ironer-hours-desc"
                  />
                  <span id="ironer-hours-desc" className="sr-only">
                    Enter the operating hours per day for ironer machines
                  </span>
                </label>
              </div>
            )}

            {/* Water Heater Operating Hours - only for Water Heater category */}
            {isWaterHeater && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <label htmlFor="waterheater-hours" className="flex flex-col text-sm font-medium text-gray-700">
                  Operating Hours (hours/day)
                  <input
                    id="waterheater-hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={categoryRates.waterheater_hours ?? ""}
                    onChange={handleWaterHeaterHoursChange}
                    onBlur={handleWaterHeaterHoursBlur}
                    className="mt-1 w-32 rounded-lg border-gray-300 shadow-sm
                               focus:border-indigo-500 focus:ring focus:ring-indigo-200 px-3 py-2 text-sm"
                    aria-describedby="waterheater-hours-desc"
                  />
                  <span id="waterheater-hours-desc" className="sr-only">
                    Enter the operating hours per day for water heater machines
                  </span>
                </label>
              </div>
            )}


            {/* Utility Rate Inputs */}
            <div className="flex flex-wrap gap-6 mb-6">
              {utilities.map((key) => {
                const labelMap = {
                  electricity: "Electricity (₱/kWh)",
                  water: "Water (₱/m³)",
                  gas: "Gas (₱/kg)",
                };
                return (
                  <label
                    key={key}
                    className="flex flex-col text-sm font-medium text-gray-700"
                    htmlFor={`${rateKey}-${key}`}
                  >
                    {labelMap[key]}
                    <input
                      id={`${rateKey}-${key}`}
                      type="number"
                      step="1"
                      value={categoryRates[rateKey]?.[key] ?? ""}
                      onChange={handleRateChange(rateKey, key)}
                      onBlur={handleRateBlur(rateKey, key)}
                      className="mt-1 w-32 rounded-lg border-gray-300 shadow-sm
                                 focus:border-indigo-500 focus:ring focus:ring-indigo-200 px-3 py-2 text-sm"
                      aria-describedby={`${rateKey}-${key}-desc`}
                    />
                    <span id={`${rateKey}-${key}-desc`} className="sr-only">
                      Enter the rate for {labelMap[key]}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Machine List */}
            {machines.map((machine, idx) => {
              const cost = calculateCostPerLoad(machine);
const catUpper = normalizeCategory(category);
const isWasher = isWasherCat(catUpper);
const isDryer = isDryerCat(catUpper);
const isIroner = isIronerCat(catUpper);
const isWaterHeater = isWaterHeaterCat(catUpper);

              const machineRates = categoryRates[rateKey] || {};

              return (
                <article
                  key={machine.id || `${category}-${machine.model}-${idx}`}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white border rounded-xl shadow-sm mb-3 hover:shadow-md transition"
                  aria-label={`${machine.model} machine details`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{machine.model}</p>
                    <p className="text-sm text-gray-500 mb-2">
                      Elec: {machine.aveElecConsump || 0} kWh
                      {isWasher && (
                        <>
                          , Hot: {machine.hotWater?.waterConsump || 0} L
                          , Cold: {machine.coldWater?.waterConsump || 0} L
                        </>
                      )}
                      {(isDryer || isIroner || isWaterHeater) && `, Gas: ${machine.gas?.btuConsumption || machine.gasBTU || 0} BTU`}
                    </p>

                    {/* Display per-machine cost */}
                    <div className="mt-1 text-sm text-gray-700 space-y-1">
                      <p>Electricity Cost per Load: {formatCurrency(cost.electricity)}</p>
                      {isWasher && (
                        <>
                          <p>Cold Water Cost per Load: {formatCurrency(cost.waterCold)}</p>
                          <p>Hot Water Cost per Load: {formatCurrency(cost.waterHot)}</p>
                        </>
                      )}
                      {isDryer && (
                        <>
                          <p className="font-semibold text-blue-600">Gas KGS/HR: {cost.dryerGasKgPerHour?.toFixed(3)} kg/hr</p>
                          <p className="font-semibold text-blue-600">Gas KGS per Load: {cost.dryerGasKgPerLoad?.toFixed(3)} kg</p>
                          <p className="font-semibold text-blue-600">LPG Cost per Load: {formatCurrency(cost.dryerGasKgPerLoad * lpgCostPerKg)}</p>
                          <p className="text-xs text-gray-500">(Based on ₱{lpgCostPerKg}/kg)</p>
                        </>
                      )}
                      {isIroner && (
                        <>
                          <p className="font-semibold text-green-600">Gas KGS/HR: {cost.ironerGasKgPerHour?.toFixed(3)} kg/hr</p>
                          <p className="font-semibold text-green-600">Gas KGS per Load: {cost.ironerGasKgPerLoad?.toFixed(3)} kg</p>
                          <p className="font-semibold text-green-600">LPG Cost per Load: {formatCurrency((cost.ironerGasKgPerLoad / (machine.quantity || 1)) * (parseFloat(machineRates.gas) || 80))}</p>
                          <p className="text-xs text-gray-500">(Based on ₱{parseFloat(machineRates.gas) || 80}/kg)</p>
                        </>
                      )}
                      {isWaterHeater && (
                        <>
                          <p className="font-semibold text-teal-600">Gas KGS/HR: {cost.waterHeaterGasKgPerHour?.toFixed(3)} kg/hr</p>
                          <p className="font-semibold text-teal-600">Gas KGS per Load: {cost.waterHeaterGasKgPerLoad?.toFixed(3)} kg</p>
                          <p className="font-semibold text-teal-600">LPG Cost per Load: {formatCurrency(cost.waterHeaterGasKgPerLoad * lpgCostPerKg)}</p>
                          <p className="text-xs text-gray-500">(Based on ₱{lpgCostPerKg}/kg)</p>
                        </>
                      )}
                      {(isWasher || isDryer || isIroner || isWaterHeater) && (
                        <p>Gas Cost per Load: {formatCurrency(cost.gas)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-3 md:mt-0">
                    <label htmlFor={`quantity-${machine.id}`} className="sr-only">
                      Quantity for {machine.model}
                    </label>
                    <input
                      id={`quantity-${machine.id}`}
                      type="number"
                      min="0"
                      step="1"
                      value={machine.quantity ?? ""}   // allow empty string
                      onChange={(e) => {
                        const val = e.target.value;
                        // let it be empty while typing
                        if (val === "") {
                          updateQuantity(machine.id, "");
                        } else {
                          updateQuantity(machine.id, Math.max(0, parseInt(val, 10) || 0));
                        }
                      }}
                      onBlur={(e) => {
                        // enforce minimum 1 only when leaving the field
                        if (e.target.value === "" || e.target.value === "0") {
                          updateQuantity(machine.id, 1);
                        }
                      }}
                      className="w-16 text-center rounded-lg border-gray-300 shadow-sm
                                focus:border-indigo-500 focus:ring focus:ring-indigo-200 px-2 py-1"
                    />

                    <button
                      onClick={() => removeMachine(machine.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
                      aria-label={`Remove machine ${machine.model}`}
                      type="button"
                    >
                      🗑
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
