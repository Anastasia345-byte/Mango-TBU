import type { SalonInputs } from "@/lib/types";

export const exampleData: SalonInputs = {
  retailRevenue: 700000,
  educationRevenue: 120000,
  certificatesRevenue: 110019,
  otherRevenue: 50000,
  ownCosmeticsRevenue: 150000,
  retailCost: 260000,
  ownCosmeticsCost: 52000,
  taxRate: 0.06,
  vatRate: 0,
  acquiringRate: 0.018,
  clientServiceRate: 0.01,
  otherBusinessVariableRate: 0,
  rent: 400000,
  utilities: 80000,
  adminPayroll: 300000,
  adminContributions: 90000,
  marketing: 100000,
  software: 40000,
  accounting: 50000,
  household: 40000,
  otherFixed: 88120,
  serviceFixedCosts: 698742,
  targetMargin: 0.25,
  minimumSafetyMargin: 0.1,
  categories: [
    { id: "m1", direction: "Маникюр", name: "Мастер", masters: 4, price: 2000, volume: 500, commissionRate: 0.4, payoutPerService: 150, consumablesRate: 0.05, otherVariableRate: 0.01, otherVariablePerService: 20 },
    { id: "m2", direction: "Маникюр", name: "ТОП-мастер", masters: 3, price: 2500, volume: 400, commissionRate: 0.4, payoutPerService: 250, consumablesRate: 0.05, otherVariableRate: 0.01, otherVariablePerService: 20 },
    { id: "p1", direction: "Педикюр", name: "Мастер", masters: 3, price: 3000, volume: 300, commissionRate: 0.4, payoutPerService: 300, consumablesRate: 0.07, otherVariableRate: 0.01, otherVariablePerService: 30 },
    { id: "b1", direction: "Брови", name: "Мастер", masters: 2, price: 1800, volume: 250, commissionRate: 0.4, payoutPerService: 100, consumablesRate: 0.04, otherVariableRate: 0.01, otherVariablePerService: 10 },
    { id: "l1", direction: "Ресницы", name: "ТОП-мастер", masters: 2, price: 2600, volume: 180, commissionRate: 0.4, payoutPerService: 250, consumablesRate: 0.06, otherVariableRate: 0.01, otherVariablePerService: 25 },
    { id: "c1", direction: "Косметология", name: "Премиум-мастер", masters: 1, price: 4662, volume: 20, commissionRate: 0.4, payoutPerService: 700, consumablesRate: 0.09, otherVariableRate: 0.02, otherVariablePerService: 50 }
  ]
};
