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

// Helper to get rate key based on category
const getRateKey = (category) => {
  const catUpper = category.toUpperCase();
  if (catUpper.includes("WASHER")) return `washer_${category}`;
  if (catUpper.includes("DRYER")) return `dryer_${category}`;
  if (catUpper.includes("IRONERS")) return `ironers_${category}`;
  return category;
};

// Helper to get applicable utilities based on category
const getUtilitiesByCategory = (category) => {
  const catUpper = category.toUpperCase();
  if (catUpper.includes("WASHER")) return ["electricity", "water", "gas"];
  if (catUpper.includes("DRYER") || catUpper.includes("IRONERS")) return ["electricity", "gas"];
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

    const handleIronerHoursBlur = (e) => {
      const num = parseFloat(e.target.value);
      setCategoryRates((prev) => ({
        ...prev,
        ironer_hours: isNaN(num) ? 0 : Math.max(0, num),
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

    // Use ironer-specific hours if available for ironers, otherwise use general hour
    const isWasher = catUpper.includes("WASHER");
    const isDryer = catUpper.includes("DRYER");
    const isIroner = catUpper.includes("IRONERS");
    const operatingHours = isIroner && categoryRates.ironer_hours ? categoryRates.ironer_hours : hour;
  
    // Calculate electricity per load (independent of operating hours)
    const electricUsage = (parseFloat(machine.totalLoad) || 0) * qty;
    // Calculate electricity per day for cost calculation
    const electricUsagePerDay = electricUsage * operatingHours;
const coldUsage =
  ((parseFloat(machine.coldWater?.waterConsump) || 0) / 1000) * qty;

const hotUsage =
  ((parseFloat(machine.hotWater?.waterConsump) || 0) / 1000) * qty;

const waterRate = parseFloat(rates.water) || 0;

// Gas cost per load
let gasCost = 0;
let washerGasCostPerLoad = 0;

// Washer: per-load kg × gas rate
if (isWasher) {
    washerGasCostPerLoad =
    ((parseFloat(machine.hotWater?.waterConsump) || 0) *
      8.34 *
      60) /
    46452;

  const gasRate = parseFloat(rates.gas) || 0;
  gasCost = (washerGasCostPerLoad|| 0) * gasRate * qty;
}

// Dryer / Ironer: BTU → kg × efficiency × gas rate
// For Ironers, divide by operating hours to get per-load cost
if (isDryer) {
  const gasRate = parseFloat(rates.gas) || 0;
  gasCost = ((parseFloat(machine.gasBTU) || 0) / BTU_TO_KG_GAS) * GAS_EFFICIENCY * gasRate * qty;
}

if (isIroner) {
  const gasRate = parseFloat(rates.gas) || 0;
  const gasPerDay = ((parseFloat(machine.gasBTU) || 0) / BTU_TO_KG_GAS) * GAS_EFFICIENCY * gasRate * qty * operatingHours;
  gasCost = operatingHours > 0 ? gasPerDay / operatingHours : 0; // Divide to get per-load cost
}

    return {
      electricity: electricUsage * (rates.electricity || 0),
  waterCold: isWasher ? coldUsage * waterRate : 0,
  waterHot: isWasher ? hotUsage * waterRate : 0,
      gas: gasCost,
    };
  };

  // Memoize grouped items by category for performance
  const groupedItems = useMemo(() => groupItemsByCategory(items), [items]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold"> Utility Rates & Machine Consumption</h2>

      {/* Ironer Operating Hours */}
      <div className="p-5 rounded-2xl shadow-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <label htmlFor="ironer-hours" className="flex flex-col text-sm font-medium text-gray-700">
          Ironer Operating Hours (hours/day)
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

      {Object.entries(groupedItems).map(([category, machines]) => {
        const rateKey = getRateKey(category);
        const utilities = getUtilitiesByCategory(category);

        return (
          <section
            key={category}
            className="p-5 rounded-2xl shadow-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-shadow duration-300"
            aria-labelledby={`category-${category}`}
          >
            <h3 id={`category-${category}`} className="text-lg font-semibold text-gray-800 mb-4">
              {category}
            </h3>

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
              const catUpper = category.toUpperCase();
              const isWasher = catUpper.includes("WASHER");
              const isDryer = catUpper.includes("DRYER");
              const isIroner = catUpper.includes("IRONERS");

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
                      {(isDryer || isIroner) && `, Gas: ${machine.gasBTU || 0} BTU`}
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
                      {(isWasher || isDryer || isIroner) && (
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
