import { z } from "zod";

const money = z.number().finite().min(0, "Значение не может быть отрицательным");
const rate = z.number().finite().min(0).max(1, "Ставка не может превышать 100%");

export const salonSchema = z.object({
  retailRevenue: money, educationRevenue: money, certificatesRevenue: money, otherRevenue: money, ownCosmeticsRevenue: money,
  retailCost: money, ownCosmeticsCost: money, taxRate: rate, vatRate: rate, acquiringRate: rate, clientServiceRate: rate,
  otherBusinessVariableRate: rate, rent: money, utilities: money, adminPayroll: money, adminContributions: money,
  marketing: money, software: money, accounting: money, household: money, otherFixed: money, serviceFixedCosts: money,
  targetMargin: rate, minimumSafetyMargin: rate,
  categories: z.array(z.object({
    id: z.string(), direction: z.string().min(1), name: z.string().min(1), masters: money, price: money, volume: money,
    commissionRate: rate, payoutPerService: money, consumablesRate: rate, otherVariableRate: rate, otherVariablePerService: money,
  })),
});
