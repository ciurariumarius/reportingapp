import { z } from "zod";

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type DatePreset =
  | "last7"
  | "last30"
  | "thisMonth"
  | "previousMonth"
  | "custom";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const MAX_RANGE_DAYS = 366;

function toUtcDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function daysBetween(startDate: string, endDate: string) {
  const start = toUtcDate(startDate).getTime();
  const end = toUtcDate(endDate).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
}

export function getDefaultDateRange(now = new Date()): DateRange {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const start = addDays(end, -29);

  return {
    startDate: formatYmd(start),
    endDate: formatYmd(end)
  };
}

export function getPresetDateRange(preset: DatePreset, now = new Date()): DateRange {
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  if (preset === "last7") {
    return { startDate: formatYmd(addDays(today, -6)), endDate: formatYmd(today) };
  }

  if (preset === "thisMonth") {
    return {
      startDate: formatYmd(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))),
      endDate: formatYmd(today)
    };
  }

  if (preset === "previousMonth") {
    const firstThisMonth = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
    );
    const lastPreviousMonth = addDays(firstThisMonth, -1);
    const firstPreviousMonth = new Date(
      Date.UTC(
        lastPreviousMonth.getUTCFullYear(),
        lastPreviousMonth.getUTCMonth(),
        1
      )
    );

    return {
      startDate: formatYmd(firstPreviousMonth),
      endDate: formatYmd(lastPreviousMonth)
    };
  }

  return getDefaultDateRange(now);
}

export function normalizeDateRange(input: {
  startDate?: string | null;
  endDate?: string | null;
}) {
  if (!input.startDate && !input.endDate) {
    return getDefaultDateRange();
  }

  const startParse = dateSchema.safeParse(input.startDate);
  const endParse = dateSchema.safeParse(input.endDate);

  if (!startParse.success || !endParse.success) {
    throw new Error("Datele trebuie sa fie in format YYYY-MM-DD.");
  }

  const start = toUtcDate(startParse.data);
  const end = toUtcDate(endParse.data);

  if (start.getTime() > end.getTime()) {
    throw new Error("Data de inceput trebuie sa fie inaintea datei de final.");
  }

  if (daysBetween(startParse.data, endParse.data) > MAX_RANGE_DAYS) {
    throw new Error("Intervalul maxim permis este de 366 de zile.");
  }

  return {
    startDate: startParse.data,
    endDate: endParse.data
  };
}

export function getMonthFromDateRange(range: DateRange) {
  return range.endDate.slice(0, 7);
}

export function listDates(range: DateRange) {
  const dates: string[] = [];
  let cursor = toUtcDate(range.startDate);
  const end = toUtcDate(range.endDate);

  while (cursor.getTime() <= end.getTime()) {
    dates.push(formatYmd(cursor));
    cursor = addDays(cursor, 1);
  }

  return dates;
}
