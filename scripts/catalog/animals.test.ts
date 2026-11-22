import { describe, expect, it } from "vitest";
import animals from "./animals.json";

describe("Catálogo de demonstração solicitado", () => {
  it("contém pelo menos 50 animais distintos", () => {
    expect(animals.length).toBeGreaterThanOrEqual(50);
    expect(new Set(animals.map(a => a.id)).size).toBe(50);
  });
  it("inclui bovinos e cavalos com fichas completas", () => {
    expect(animals.filter(a => a.species === "bovino")).toHaveLength(25);
    expect(animals.filter(a => a.species === "equino")).toHaveLength(25);
    expect(animals.every(a => a.name && a.breed && a.photo && a.birth_date && a.seller_id && a.weight > 0)).toBe(true);
  });
  it("distribui animais entre leilão e venda direta", () => {
    expect(animals.filter(a => !a.is_direct_sale)).toHaveLength(30);
    expect(animals.filter(a => a.is_direct_sale && (a.sale_price ?? 0) > 0)).toHaveLength(20);
  });
});
