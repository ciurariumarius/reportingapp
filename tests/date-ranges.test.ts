import { describe, expect, it } from "vitest";
import {
  daysBetween,
  getPreviousEquivalentDateRange,
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

  it("builds yesterday preset", () => {
    expect(getPresetDateRange("yesterday", new Date("2026-07-08T12:00:00Z"))).toEqual({
      startDate: "2026-07-07",
      endDate: "2026-07-07"
    });
  });

  it("builds this week preset from Monday to today", () => {
    expect(getPresetDateRange("thisWeek", new Date("2026-07-08T12:00:00Z"))).toEqual({
      startDate: "2026-07-06",
      endDate: "2026-07-08"
    });
  });

  it("builds previous month preset", () => {
    expect(getPresetDateRange("previousMonth", new Date("2026-07-07T12:00:00Z"))).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-30"
    });
  });

  it("builds the previous equivalent comparison range", () => {
    expect(
      getPreviousEquivalentDateRange({
        startDate: "2026-07-01",
        endDate: "2026-07-30"
      })
    ).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-30"
    });
  });
});
