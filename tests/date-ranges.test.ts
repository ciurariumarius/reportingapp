import { describe, expect, it } from "vitest";
import {
  daysBetween,
  getPresetDateRange,
  normalizeDateRange
} from "@/lib/date-ranges";

describe("date ranges", () => {
  it("accepts a valid custom range", () => {
    expect(
      normalizeDateRange({ startDate: "2026-07-01", endDate: "2026-07-07" })
    ).toEqual({
      startDate: "2026-07-01",
      endDate: "2026-07-07"
    });
  });

  it("rejects reversed ranges", () => {
    expect(() =>
      normalizeDateRange({ startDate: "2026-07-08", endDate: "2026-07-07" })
    ).toThrow("Data de inceput");
  });

  it("calculates inclusive day counts", () => {
    expect(daysBetween("2026-07-01", "2026-07-07")).toBe(7);
  });

  it("builds previous month preset", () => {
    expect(getPresetDateRange("previousMonth", new Date("2026-07-07T12:00:00Z"))).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-30"
    });
  });
});
