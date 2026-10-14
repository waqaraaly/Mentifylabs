"use server";

import { revalidatePath } from "next/cache";
import { revalidateAdminViews } from "@/lib/revalidate";
import { addSlot, updateSlot, deleteSlot, getSlotsByPractitioner, setSlotStatus, getSlotById, slotsOverlap } from "@/data/slots";
import type { SlotStatus } from "@/types/slot";
import {
  addWeeklyRule,
  updateWeeklyRule,
  removeWeeklyRule,
  weeklyRuleOverlaps,
  addTimeOff,
  removeTimeOff,
  generateUpcomingSlots,
  blockOpenSlotsInRange,
  releaseSlotsInRange,
  setDayOverride,
  resetDateToWeeklyHours,
  getDayOverride,
  getDayOverrides,
} from "@/data/availability";
import { WEEKDAYS_FULL } from "@/lib/format";
import { getAppointmentsByPractitioner } from "@/data/appointments";
import { parseSlotSessionType } from "@/lib/sessionType";
import { requireOwnSlug } from "@/data/practitioners";
import { isIsoDate, validTimeRange } from "@/lib/validate";

function revalidatePortalAndPublic(slug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/slots");
  revalidatePath(`/${slug}`);
  revalidateAdminViews();
}

/**
 * Any one-off change to a single date's slots turns that date into a custom date, so the weekly
 * pattern stops refilling it. A date that's already overridden (custom or unavailable) is left as is.
 */
async function markDateCustom(slug: string, date: string) {
  if (!(await getDayOverride(slug, date))) await setDayOverride(slug, date, "custom");
}

export async function addSlotAction(formData: FormData): Promise<{ error?: string }> {
  const practitionerSlug = await requireOwnSlug(formData.get("practitionerSlug")?.toString());
  const date = formData.get("date")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const sessionType = parseSlotSessionType(formData.get("sessionType")?.toString());

  if (!practitionerSlug || !date || !startTime || !endTime || !sessionType) return { error: "Missing fields." };
  if (!isIsoDate(date)) return { error: "Choose a valid date." };
  const timeError = validTimeRange(startTime, endTime);
  if (timeError) return { error: timeError };

  const override = await getDayOverride(practitionerSlug, date);
  if (override?.type === "unavailable") {
    // Adding availability replaces the block: only booked sessions still count for overlaps, and the
    // blocked leftovers are cleared so they can't cause a hidden conflict.
    const onDate = (await getSlotsByPractitioner(practitionerSlug)).filter((s) => s.date === date);
    const clash = onDate.some((s) => s.status !== "unavailable" && s.startTime < endTime && startTime < s.endTime);
    if (clash) return { error: "This overlaps with an existing slot on that date." };
    for (const s of onDate) if (s.status === "unavailable") await deleteSlot(s.id);
    await setDayOverride(practitionerSlug, date, "custom");
  } else if (await slotsOverlap(practitionerSlug, date, startTime, endTime)) {
    return { error: "This overlaps with an existing slot on that date." };
  }

  await addSlot({ practitionerSlug, date, startTime, endTime, sessionType });
  await markDateCustom(practitionerSlug, date);
  revalidatePortalAndPublic(practitionerSlug);
  return {};
}

/** All of one date's slots, earliest first — used to manage a single date's slots alongside adding new ones. */
export async function getSlotsForDateAction(slug: string, date: string) {
  await requireOwnSlug(slug);
  const slots = await getSlotsByPractitioner(slug);
  return slots.filter((s) => s.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function editSlotAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const date = formData.get("date")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const sessionType = parseSlotSessionType(formData.get("sessionType")?.toString());

  if (!id || !slug || !date || !startTime || !endTime || !sessionType) return;
  if (!isIsoDate(date) || validTimeRange(startTime, endTime)) return;
  const existing = await getSlotById(id);
  // A booked slot holds a client's appointment, and a clash would create a double booking.
  if (!existing || existing.practitionerSlug !== slug || existing.status === "booked") return;
  if (await slotsOverlap(slug, date, startTime, endTime, id)) return;

  await updateSlot(id, { date, startTime, endTime, sessionType });
  revalidatePortalAndPublic(slug);
}

/** Changes one slot's time/type for its own date only (never the weekly pattern), refusing overlaps. */
export async function updateSlotDetailsAction(formData: FormData): Promise<{ error?: string }> {
  const id = formData.get("id")?.toString();
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const sessionType = parseSlotSessionType(formData.get("sessionType")?.toString());
  if (!id || !slug || !startTime || !endTime || !sessionType) return { error: "Missing fields." };
  const timeError = validTimeRange(startTime, endTime);
  if (timeError) return { error: timeError };

  const slot = await getSlotById(id);
  if (!slot || slot.practitionerSlug !== slug) return { error: "This slot no longer exists." };
  if (slot.status === "booked") return { error: "This slot is booked. Cancel the appointment before changing it." };
  if (await slotsOverlap(slug, slot.date, startTime, endTime, id)) {
    return { error: "This overlaps with another slot on that date." };
  }

  await updateSlot(id, { startTime, endTime, sessionType });
  await markDateCustom(slug, slot.date);
  revalidatePortalAndPublic(slug);
  return {};
}

export async function deleteSlotAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  if (!id || !slug) return;

  const slot = await getSlotById(id);
  if (!slot || slot.practitionerSlug !== slug || slot.status === "booked") return;

  await deleteSlot(id);
  await markDateCustom(slug, slot.date);
  revalidatePortalAndPublic(slug);
}

/** Duplicates one slot's time/type onto another date, as a new open slot. */
export async function copySlotAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const targetDate = formData.get("targetDate")?.toString();
  if (!id || !slug || !isIsoDate(targetDate)) return;

  const slot = await getSlotById(id);
  if (!slot || slot.practitionerSlug !== slug) return;
  if (await slotsOverlap(slug, targetDate, slot.startTime, slot.endTime)) return;

  await addSlot({
    practitionerSlug: slug,
    date: targetDate,
    startTime: slot.startTime,
    endTime: slot.endTime,
    sessionType: slot.sessionType,
  });
  await markDateCustom(slug, targetDate);
  revalidatePortalAndPublic(slug);
}

const VALID_STATUSES: SlotStatus[] = ["open", "booked", "unavailable"];

/** Sets any slot's status directly — used for "Mark booked", "Block", and "Reopen" in the day-by-day calendar. */
export async function setSlotStatusAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const status = formData.get("status")?.toString();
  if (!id || !slug || !status || !VALID_STATUSES.includes(status as SlotStatus)) return;

  const slot = await getSlotById(id);
  if (!slot || slot.practitionerSlug !== slug) return;
  if (slot.status === "booked" && status !== "booked") return;

  await setSlotStatus(id, status as SlotStatus);
  await markDateCustom(slug, slot.date);
  revalidatePortalAndPublic(slug);
}

/**
 * The other weekdays chosen on the form, and, if any of them already has overlapping hours, the message to show.
 * Checked before anything is saved, so one clash saves nothing and the form can be corrected and sent again.
 */
async function chosenCopyDays(slug: string, weekday: number, startTime: string, endTime: string, formData: FormData) {
  const days = [...new Set(formData.getAll("targets").map(Number))].filter(
    (n) => Number.isInteger(n) && n >= 0 && n <= 6 && n !== weekday,
  );
  const clashes: string[] = [];
  for (const day of days) {
    if (await weeklyRuleOverlaps(slug, day, startTime, endTime)) clashes.push(WEEKDAYS_FULL[day]);
  }
  const error = clashes.length
    ? `Overlaps with an existing slot on ${clashes.join(", ")}. Untick ${clashes.length === 1 ? "that day" : "those days"} to continue.`
    : null;
  return { days, error };
}

/** Adds one more recurring slot to a weekday — used by the day-manage popup. */
export async function addWeeklyRuleAction(formData: FormData): Promise<{ error?: string }> {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const weekdayRaw = formData.get("weekday")?.toString();
  const weekday = weekdayRaw ? Number(weekdayRaw) : NaN;
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const sessionType = parseSlotSessionType(formData.get("sessionType")?.toString());
  if (!slug || !Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !startTime || !endTime || !sessionType) {
    return { error: "Missing fields." };
  }
  const timeError = validTimeRange(startTime, endTime);
  if (timeError) return { error: timeError };
  if (await weeklyRuleOverlaps(slug, weekday, startTime, endTime)) {
    return { error: "This overlaps with an existing slot on that day." };
  }

  const copy = await chosenCopyDays(slug, weekday, startTime, endTime, formData);
  if (copy.error) return { error: copy.error };

  for (const day of [weekday, ...copy.days]) await addWeeklyRule(slug, day, { startTime, endTime, sessionType });
  await generateUpcomingSlots(slug);
  revalidatePortalAndPublic(slug);
  return {};
}

/** Edits one recurring weekday slot's hours/type. */
export async function updateWeeklyRuleAction(formData: FormData): Promise<{ error?: string }> {
  const id = formData.get("id")?.toString();
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const weekdayRaw = formData.get("weekday")?.toString();
  const weekday = weekdayRaw ? Number(weekdayRaw) : NaN;
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const sessionType = parseSlotSessionType(formData.get("sessionType")?.toString());
  if (!id || !slug || !Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !startTime || !endTime || !sessionType) {
    return { error: "Missing fields." };
  }
  const timeError = validTimeRange(startTime, endTime);
  if (timeError) return { error: timeError };
  if (await weeklyRuleOverlaps(slug, weekday, startTime, endTime, id)) {
    return { error: "This overlaps with an existing slot on that day." };
  }

  const copy = await chosenCopyDays(slug, weekday, startTime, endTime, formData);
  if (copy.error) return { error: copy.error };

  await updateWeeklyRule(slug, id, { startTime, endTime, sessionType });
  for (const day of copy.days) await addWeeklyRule(slug, day, { startTime, endTime, sessionType });
  await generateUpcomingSlots(slug);
  revalidatePortalAndPublic(slug);
  return {};
}

/** Removes one recurring weekday slot. */
export async function removeWeeklyRuleAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  if (!id || !slug) return;

  await removeWeeklyRule(slug, id);
  revalidatePortalAndPublic(slug);
}

export async function addTimeOffAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const startDate = formData.get("startDate")?.toString();
  const endDateRaw = formData.get("endDate")?.toString();
  const label = formData.get("label")?.toString();
  if (!slug || !isIsoDate(startDate)) return;

  const endDate = isIsoDate(endDateRaw) && endDateRaw >= startDate ? endDateRaw : startDate;
  await addTimeOff(slug, startDate, endDate, label && label.trim() ? label.trim().slice(0, 100) : "Time off");
  await blockOpenSlotsInRange(slug, startDate, endDate);
  revalidatePortalAndPublic(slug);
}

export async function removeTimeOffAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  if (!id || !slug) return;

  const removed = await removeTimeOff(slug, id);
  if (removed) {
    await releaseSlotsInRange(slug, removed.startDate, removed.endDate);
    await generateUpcomingSlots(slug);
  }
  revalidatePortalAndPublic(slug);
}

/** Drops a single date back to following the weekly pattern — used by the per-day "Use weekly hours" option. */
export async function applyWeeklyHoursForDateAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const date = formData.get("date")?.toString();
  if (!slug || !isIsoDate(date)) return;

  await resetDateToWeeklyHours(slug, date);
  revalidatePortalAndPublic(slug);
}

/** The override (if any) in effect for a single date — used to show its current status in the manage-slots modal. */
export async function getDayOverrideAction(slug: string, date: string) {
  await requireOwnSlug(slug);
  return getDayOverride(slug, date);
}

/** Marks a date fully unavailable — clients can't book it, and the weekly pattern stops filling it. */
export async function markDateUnavailableAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const date = formData.get("date")?.toString();
  if (!slug || !isIsoDate(date)) return;

  await setDayOverride(slug, date, "unavailable");
  await blockOpenSlotsInRange(slug, date, date);
  revalidatePortalAndPublic(slug);
}

/** Active appointments (pending or confirmed) on these dates — shown as a conflict list before blocking them. */
export async function getConflictsAction(
  slug: string,
  dates: string[],
): Promise<{ date: string; startTime: string; clientName: string; status: "pending" | "confirmed" }[]> {
  await requireOwnSlug(slug);
  const appointments = await getAppointmentsByPractitioner(slug);
  return appointments
    .filter((a) => dates.includes(a.date) && (a.status === "pending" || a.status === "confirmed"))
    .map((a) => ({ date: a.date, startTime: a.startTime, clientName: a.clientName, status: a.status as "pending" | "confirmed" }))
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
}

/** Dates already marked unavailable — the multi-date picker greys these out. */
export async function getUnavailableDatesAction(slug: string): Promise<string[]> {
  await requireOwnSlug(slug);
  const overrides = await getDayOverrides(slug);
  return overrides.filter((o) => o.type === "unavailable").map((o) => o.date);
}

/**
 * Blocks chosen open slots on one date, leaving the rest of the day as it is. Booked slots and slots from another
 * date or practitioner are ignored. Like any one-off change to a date, it makes that date a custom date.
 */
export async function markSlotsUnavailableAction(slug: string, date: string, slotIds: string[]): Promise<{ blocked: number }> {
  const own = await requireOwnSlug(slug);
  if (!own || !isIsoDate(date)) return { blocked: 0 };

  let blocked = 0;
  for (const id of new Set(slotIds)) {
    const slot = await getSlotById(id);
    if (!slot || slot.practitionerSlug !== own || slot.date !== date || slot.status !== "open") continue;
    await setSlotStatus(id, "unavailable");
    blocked += 1;
  }
  if (blocked > 0) {
    await markDateCustom(own, date);
    revalidatePortalAndPublic(own);
  }
  return { blocked };
}

/** Marks several dates unavailable in one go. Booked sessions are left scheduled; only open slots are blocked. */
export async function markDatesUnavailableAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const dates = formData.getAll("dates").map(String).filter((d) => isIsoDate(d));
  if (!slug || dates.length === 0) return;

  for (const date of dates) {
    if ((await getDayOverride(slug, date))?.type === "unavailable") continue;
    await setDayOverride(slug, date, "unavailable");
    await blockOpenSlotsInRange(slug, date, date);
  }
  revalidatePortalAndPublic(slug);
}
