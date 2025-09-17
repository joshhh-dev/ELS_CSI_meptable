// Example computation functions

export function calculateElectricity(machine, cycles = 1) {
  if (!machine.electricity) return 0;
  return machine.electricity * cycles; // kWh
}

export function calculateWater(machine, cycles = 1) {
  if (!machine.water) return 0;
  return machine.water * cycles; // liters
}

export function calculateGas(machine, cycles = 1) {
  if (!machine.gas) return 0;
  return machine.gas * cycles; // m³ or kWh
}

export function getTotalConsumption(cart, cycles = 1) {
  return cart.reduce(
    (totals, m) => {
      totals.electricity += calculateElectricity(m, cycles);
      totals.water += calculateWater(m, cycles);
      totals.gas += calculateGas(m, cycles);
      return totals;
    },
    { electricity: 0, water: 0, gas: 0 }
  );
}
