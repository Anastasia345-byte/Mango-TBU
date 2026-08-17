import type { SalonInputs } from "@/lib/types";

export const exampleData: SalonInputs = {
  retailRevenue: 449600,
  educationRevenue: 221080,
  certificatesRevenue: 348799,
  otherRevenue: 0,
  ownCosmeticsRevenue: 110540,
  retailCost: 110000,
  ownCosmeticsCost: 30195.33127445617,
  taxRate: 0.08,
  vatRate: 0.047619047619047616,
  acquiringRate: 0.03931557573217325,
  clientServiceRate: 0.01586905175869758,
  otherBusinessVariableRate: 0,
  rent: 280000,
  utilities: 35000,
  adminPayroll: 240000,
  adminContributions: 36960,
  marketing: 228800,
  software: 14560,
  accounting: 146000,
  household: 114800,
  otherFixed: 92000,
  serviceFixedCosts: 698742.3119502489,
  targetMargin: 0.25,
  minimumSafetyMargin: 0.1,
  categories: [
    { id: "nail-vip", direction: "Маникюр / педикюр", name: "VIP-мастер", masters: 2, price: 3900, volume: 149.0911475409836, commissionRate: 0.4, payoutPerService: 550, consumablesRate: 0.06358337920062732, otherVariableRate: 0, otherVariablePerService: 0 },
    { id: "nail-premium", direction: "Маникюр / педикюр", name: "Премиум-мастер", masters: 6, price: 3400, volume: 447.2734426, commissionRate: 0.4, payoutPerService: 300, consumablesRate: 0.06358337920062732, otherVariableRate: 0, otherVariablePerService: 0 },
    { id: "nail-top", direction: "Маникюр / педикюр", name: "TOP-мастер", masters: 5, price: 2900, volume: 372.7278689, commissionRate: 0.4, payoutPerService: 220, consumablesRate: 0.06358337920062732, otherVariableRate: 0, otherVariablePerService: 0 },
    { id: "lashes-vip", direction: "Ресницы", name: "VIP-мастер", masters: 1, price: 4300, volume: 32.866125, commissionRate: 0, payoutPerService: 500, consumablesRate: 0, otherVariableRate: 0, otherVariablePerService: 0 },
    { id: "lashes-premium", direction: "Ресницы", name: "Премиум-мастер", masters: 3, price: 3900, volume: 98.598375, commissionRate: 0, payoutPerService: 500, consumablesRate: 0, otherVariableRate: 0, otherVariablePerService: 0 },
    { id: "brows-vip", direction: "Брови", name: "VIP-мастер", masters: 1, price: 2200, volume: 91.94818181818182, commissionRate: 0, payoutPerService: 300, consumablesRate: 0, otherVariableRate: 0, otherVariablePerService: 0 }
  ]
};
