import { describe, expect, it } from "vitest";
import control from "@/data/control-data.json";
import { calculateBep, calculateSalon } from "./finance";
import { exampleData } from "@/data/example";

describe("расчёт ТБУ", () => {
  it("совпадает с контрольными значениями в пределах 1 ₽", () => {
    expect(calculateBep(control.businessFixedCosts, control.businessCmr)).toBeCloseTo(control.expectedBusinessBep, 6);
    expect(calculateBep(control.serviceFixedCosts, control.serviceCmr)).toBeCloseTo(control.expectedServiceBep, 6);
  });

  it("не смешивает индивидуальную ТБУ и распределённую долю", () => {
    const result = calculateSalon(exampleData);
    const allocated = result.categories.reduce((sum, c) => sum + (c.allocatedServiceBep ?? 0), 0);
    expect(allocated).toBeCloseTo(result.serviceBep ?? 0, 6);
  });

  it("не рассчитывает ТБУ при нулевой или отрицательной марже", () => {
    expect(calculateBep(100000, 0)).toBeNull();
    expect(calculateBep(100000, -0.1)).toBeNull();
  });

  it("обрабатывает пустые категории и деление на ноль", () => {
    const result = calculateSalon({ ...exampleData, categories: [] });
    expect(result.serviceRevenue).toBe(0);
    expect(result.serviceBep).toBeNull();
  });

  it("не рассчитывает недостижимую целевую цену", () => {
    const result = calculateSalon({ ...exampleData, targetMargin: 0.7 });
    expect(result.categories.every((c) => c.targetPrice === null)).toBe(true);
  });
});
