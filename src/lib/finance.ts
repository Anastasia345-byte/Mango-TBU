import type { CalculationResult, CategoryResult, SalonInputs } from "./types";

const safeDiv = (a: number, b: number): number | null => b === 0 || !Number.isFinite(a / b) ? null : a / b;
const nonNegative = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);

export function calculateBep(fixedCosts: number, cmr: number): number | null {
  return cmr > 0 && Number.isFinite(fixedCosts / cmr) ? fixedCosts / cmr : null;
}

export function calculateSalon(input: SalonInputs): CalculationResult {
  const categories = input.categories.map((c) => ({ ...c, price: nonNegative(c.price), volume: nonNegative(c.volume) }));
  const serviceRevenue = categories.reduce((sum, c) => sum + c.price * c.volume, 0);
  const sharedRate = nonNegative(input.taxRate + input.vatRate + input.acquiringRate + input.clientServiceRate + input.otherBusinessVariableRate);
  const serviceFixedCosts = nonNegative(input.serviceFixedCosts);

  const firstPass = categories.map((c) => {
    const revenue = c.price * c.volume;
    const commission = revenue * nonNegative(c.commissionRate);
    const payout = nonNegative(c.payoutPerService) * c.volume;
    const consumables = revenue * nonNegative(c.consumablesRate);
    const otherVariable = revenue * nonNegative(c.otherVariableRate) + nonNegative(c.otherVariablePerService) * c.volume;
    const sharedFees = revenue * sharedRate;
    const variableCosts = commission + payout + consumables + otherVariable + sharedFees;
    const contribution = revenue - variableCosts;
    const contributionPerService = c.volume > 0 ? contribution / c.volume : null;
    const cmr = safeDiv(contribution, revenue);
    const revenueShare = serviceRevenue > 0 ? revenue / serviceRevenue : 0;
    const allocatedFixedCosts = serviceFixedCosts * revenueShare;
    return { c, revenue, commission, payout, consumables, otherVariable, sharedFees, variableCosts, contribution, contributionPerService, cmr, revenueShare, allocatedFixedCosts };
  });

  const serviceVariableCosts = firstPass.reduce((sum, c) => sum + c.variableCosts, 0);
  const serviceContribution = serviceRevenue - serviceVariableCosts;
  const serviceCmr = safeDiv(serviceContribution, serviceRevenue);
  const serviceBep = serviceCmr && serviceCmr > 0 ? serviceFixedCosts / serviceCmr : null;

  const categoryResults: CategoryResult[] = firstPass.map((x) => {
    const variableRate = nonNegative(x.c.commissionRate + x.c.consumablesRate + x.c.otherVariableRate) + sharedRate;
    const fixedPerUnit = x.c.volume > 0 ? x.allocatedFixedCosts / x.c.volume : null;
    const baseNumerator = fixedPerUnit === null ? null : nonNegative(x.c.payoutPerService) + nonNegative(x.c.otherVariablePerService) + fixedPerUnit;
    const minimumDenominator = 1 - variableRate;
    const targetDenominator = 1 - variableRate - nonNegative(input.targetMargin);
    const minimumPrice = baseNumerator !== null && minimumDenominator > 0 ? baseNumerator / minimumDenominator : null;
    const targetPrice = baseNumerator !== null && targetDenominator > 0 ? baseNumerator / targetDenominator : null;
    const individualBepUnits = x.contributionPerService && x.contributionPerService > 0 ? x.allocatedFixedCosts / x.contributionPerService : null;
    const individualBepRevenue = individualBepUnits === null ? null : individualBepUnits * x.c.price;
    const allocatedServiceBep = serviceBep === null ? null : serviceBep * x.revenueShare;
    const profit = x.contribution - x.allocatedFixedCosts;
    const margin = safeDiv(profit, x.revenue);
    const status = x.revenue <= 0 ? "no-data" : profit < 0 ? "loss" : margin !== null && margin < input.minimumSafetyMargin ? "warning" : "safe";
    return { ...x.c, revenue: x.revenue, commission: x.commission, payout: x.payout, consumables: x.consumables, otherVariable: x.otherVariable, sharedFees: x.sharedFees, variableCosts: x.variableCosts, contribution: x.contribution, contributionPerService: x.contributionPerService, cmr: x.cmr, revenueShare: x.revenueShare, allocatedFixedCosts: x.allocatedFixedCosts, individualBepUnits, individualBepRevenue, allocatedServiceBep, minimumPrice, targetPrice, profit, margin, status };
  });

  const otherRevenue = nonNegative(input.retailRevenue + input.educationRevenue + input.certificatesRevenue + input.otherRevenue + input.ownCosmeticsRevenue);
  const totalRevenue = serviceRevenue + otherRevenue;
  const goodsCost = nonNegative(input.retailCost + input.ownCosmeticsCost);
  const otherSharedFees = otherRevenue * sharedRate;
  const totalVariableCosts = serviceVariableCosts + goodsCost + otherSharedFees;
  const businessFixedCosts = nonNegative(input.rent + input.utilities + input.adminPayroll + input.adminContributions + input.marketing + input.software + input.accounting + input.household + input.otherFixed);
  const totalContribution = totalRevenue - totalVariableCosts;
  const businessCmr = safeDiv(totalContribution, totalRevenue);
  const businessBep = businessCmr && businessCmr > 0 ? businessFixedCosts / businessCmr : null;
  const profit = totalContribution - businessFixedCosts;
  const profitMargin = safeDiv(profit, totalRevenue);
  const safetyMarginRub = businessBep === null ? null : totalRevenue - businessBep;
  const safetyMarginPercent = safetyMarginRub === null ? null : safeDiv(safetyMarginRub, totalRevenue);

  const expenseBreakdown = [
    { name: "Комиссии мастерам", value: categoryResults.reduce((s, c) => s + c.commission, 0), type: "Переменные" as const },
    { name: "Выплаты за услуги", value: categoryResults.reduce((s, c) => s + c.payout, 0), type: "Переменные" as const },
    { name: "Расходные материалы", value: categoryResults.reduce((s, c) => s + c.consumables, 0), type: "Переменные" as const },
    { name: "Налоги и комиссии", value: categoryResults.reduce((s, c) => s + c.sharedFees, 0) + otherSharedFees, type: "Переменные" as const },
    { name: "Прочие переменные", value: categoryResults.reduce((s, c) => s + c.otherVariable, 0), type: "Переменные" as const },
    { name: "Товарная себестоимость", value: goodsCost, type: "Переменные" as const },
    { name: "Аренда", value: input.rent, type: "Постоянные" as const },
    { name: "Административный ФОТ", value: input.adminPayroll + input.adminContributions, type: "Постоянные" as const },
    { name: "Маркетинг", value: input.marketing, type: "Постоянные" as const },
    { name: "Прочие постоянные", value: input.utilities + input.software + input.accounting + input.household + input.otherFixed, type: "Постоянные" as const },
    { name: profit >= 0 ? "Прибыль" : "Убыток", value: Math.abs(profit), type: "Результат" as const },
  ].filter((item) => item.value > 0);

  const allocatedFixedSum = categoryResults.reduce((s, c) => s + c.allocatedFixedCosts, 0);
  const allocatedBepSum = categoryResults.reduce((s, c) => s + (c.allocatedServiceBep ?? 0), 0);
  const recommendations: string[] = [];
  if (businessBep !== null && totalRevenue < businessBep) recommendations.push(`Салон не покрывает расходы: для безубыточности нужно увеличить выручку на ${Math.round(businessBep - totalRevenue).toLocaleString("ru-RU")} ₽ или сократить расходы на эквивалентную сумму.`);
  if (safetyMarginPercent !== null && safetyMarginPercent < input.minimumSafetyMargin) recommendations.push(`Запас финансовой прочности — ${(safetyMarginPercent * 100).toFixed(1)}%. Снижение выручки выше этого уровня приведёт к убытку.`);
  categoryResults.filter((c) => c.individualBepRevenue !== null && c.revenue < c.individualBepRevenue).forEach((c) => recommendations.push(`${c.direction} / ${c.name}: не покрывает выделенную долю постоянных расходов; дефицит ${Math.round((c.individualBepRevenue ?? 0) - c.revenue).toLocaleString("ru-RU")} ₽.`));
  if (safeDiv(totalVariableCosts, totalRevenue) !== null && totalVariableCosts / totalRevenue > 0.7) recommendations.push(`Переменные расходы занимают ${(totalVariableCosts / totalRevenue * 100).toFixed(1)}% выручки. Приоритет — пересмотр комиссии мастеров, выплат и себестоимости.`);
  categoryResults.filter((c) => c.targetPrice && c.targetPrice > c.price * 1.3).forEach((c) => recommendations.push(`${c.direction} / ${c.name}: рекомендуемая цена выше текущей более чем на 30%. Используйте комбинированный сценарий: цена, загрузка и снижение переменных расходов.`));
  if (!recommendations.length) recommendations.push(`Модель покрывает текущие расходы. Контролируйте запас прочности и поддерживайте рентабельность не ниже ${(input.targetMargin * 100).toFixed(0)}%.`);

  return {
    totalRevenue, serviceRevenue, totalVariableCosts, serviceVariableCosts, totalContribution, serviceContribution,
    businessCmr, serviceCmr, businessFixedCosts, serviceFixedCosts, businessBep, serviceBep, profit, profitMargin,
    safetyMarginRub, safetyMarginPercent, categories: categoryResults, expenseBreakdown,
    checks: [
      { label: "Выручка услуг равна сумме категорий", ok: Math.abs(serviceRevenue - categoryResults.reduce((s, c) => s + c.revenue, 0)) <= 1 },
      { label: "Постоянные расходы услуг распределены полностью", ok: Math.abs(serviceFixedCosts - allocatedFixedSum) <= 1, delta: serviceFixedCosts - allocatedFixedSum },
      { label: "Доли общей ТБУ сходятся с ТБУ услуг", ok: serviceBep === null || Math.abs(serviceBep - allocatedBepSum) <= 1, delta: serviceBep === null ? undefined : serviceBep - allocatedBepSum },
      { label: "Расходы и прибыль сходятся с выручкой", ok: Math.abs(totalRevenue - totalVariableCosts - businessFixedCosts - profit) <= 1 },
    ], recommendations,
  };
}
