import { describe, expect, it } from "vitest";
import {
  daysBetween,
  formatFriendlyRange,
  getDefaultDateRange,
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

  it("builds the default range as 30 complete days ending yesterday", () => {
    expect(getDefaultDateRange(new Date("2026-07-08T12:00:00Z"))).toEqual({
      startDate: "2026-06-08",
      endDate: "2026-07-07"
    });
  });

  it("builds this week preset from Monday to yesterday", () => {
    expect(getPresetDateRange("thisWeek", new Date("2026-07-08T12:00:00Z"))).toEqual({
      startDate: "2026-07-06",
      endDate: "2026-07-07"
    });
  });

  it("keeps this week preset valid on Mondays", () => {
    expect(getPresetDateRange("thisWeek", new Date("2026-07-06T12:00:00Z"))).toEqual({
      startDate: "2026-07-05",
      endDate: "2026-07-05"
    });
  });

  it("builds last 7 days as complete days ending yesterday", () => {
    expect(getPresetDateRange("last7", new Date("2026-07-08T12:00:00Z"))).toEqual({
      startDate: "2026-07-01",
      endDate: "2026-07-07"
    });
  });

  it("builds last 30 days as complete days ending yesterday", () => {
    expect(getPresetDateRange("last30", new Date("2026-07-08T12:00:00Z"))).toEqual({
      startDate: "2026-06-08",
      endDate: "2026-07-07"
    });
  });

  it("builds this month preset from month start to yesterday", () => {
    expect(getPresetDateRange("thisMonth", new Date("2026-07-08T12:00:00Z"))).toEqual({
      startDate: "2026-07-01",
      endDate: "2026-07-07"
    });
  });

  it("keeps this month preset valid on the first day of the month", () => {
    expect(getPresetDateRange("thisMonth", new Date("2026-07-01T12:00:00Z"))).toEqual({
      startDate: "2026-06-30",
      endDate: "2026-06-30"
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

  it("formats friendly ranges without repeating the year", () => {
    expect(
      formatFriendlyRange({
        startDate: "2026-07-01",
        endDate: "2026-07-08"
      })
    ).toBe("01 - 08 Iulie 2026");
    expect(
      formatFriendlyRange({
        startDate: "2026-06-24",
        endDate: "2026-07-08"
      })
    ).toBe("24 Iunie - 08 Iulie 2026");
  });
});
