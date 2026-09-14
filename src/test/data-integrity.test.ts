import { describe, expect, it } from "vitest";
import { hcpDatabase } from "../data/hcpListData";
import { nbaActions, signals } from "../data/mockData";

const hasUniqueValues = (values: string[]) => new Set(values).size === values.length;

describe("portfolio fixture integrity", () => {
  it("keeps HCP and signal identifiers unique", () => {
    expect(hasUniqueValues(hcpDatabase.map((hcp) => hcp.hcpId))).toBe(true);
    expect(hasUniqueValues(signals.map((signal) => signal.id))).toBe(true);
    expect(hasUniqueValues(nbaActions.map((action) => action.id))).toBe(true);
  });

  it("keeps scores, affinity values, and priorities within supported ranges", () => {
    for (const signal of signals) {
      expect(signal.affinity).toBeGreaterThanOrEqual(0);
      expect(signal.affinity).toBeLessThanOrEqual(1);
      expect(["high", "medium", "low"]).toContain(signal.priority);
    }

    for (const action of nbaActions) {
      expect(action.score).toBeGreaterThanOrEqual(0);
      expect(action.score).toBeLessThanOrEqual(100);
      expect(["high", "medium", "low"]).toContain(action.priority);
    }
  });

  it("uses secure URLs for populated HCP profile links", () => {
    for (const hcp of hcpDatabase) {
      if (hcp.officialWebsite && hcp.officialWebsite !== "—") {
        expect(hcp.officialWebsite.startsWith("https://")).toBe(true);
      }
    }
  });
});
