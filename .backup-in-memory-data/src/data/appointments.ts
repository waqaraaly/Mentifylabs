import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { getSlotById, setSlotStatus } from "./slots";
import { resolveSessionType, type BookedSessionType } from "@/lib/sessionType";

/**
 * In-memory data source (module-level array). Swap the bodies below for
 * Cloudflare D1 queries once the schema exists — every function is async
 * on purpose so call sites never change.
 */
const APPOINTMENTS: Appointment[] = [
  {
    id: "appt-mock-late-9pm",
    clientId: "CL-1110",
    practitionerSlug: "dr-ali",
    slotId: "slot-30",
    clientName: "Sana Tariq",
    clientContact: "0300 5566778",
    concern: "Evening slot works best around my shifts.",
    date: "2026-09-24",
    startTime: "21:00",
    endTime: "21:50",
    sessionType: "offline",
    status: "completed",
    createdAt: "2026-09-21T18:10:00",
  },
  {
    id: "appt-mock-late-10pm",
    clientId: "CL-1111",
    practitionerSlug: "dr-ali",
    slotId: "slot-31",
    clientName: "Imran Shah",
    clientContact: "0300 7788990",
    concern: "Trouble winding down at night; prefer a late session.",
    date: "2026-09-25",
    startTime: "22:00",
    endTime: "22:50",
    sessionType: "online",
    status: "completed",
    createdAt: "2026-09-22T20:30:00",
  },
  {
    id: "appt-mock-late-midnight",
    clientId: "CL-1112",
    practitionerSlug: "dr-ali",
    slotId: "slot-32",
    clientName: "Maryam Zafar",
    clientContact: "0300 9900112",
    concern: "Overnight shift worker; midnight is the only time I am free.",
    date: "2026-09-27",
    startTime: "00:00",
    endTime: "00:50",
    sessionType: "online",
    status: "confirmed",
    createdAt: "2026-09-23T13:45:00",
  },
  {
    id: "appt-mock-26a",
    clientId: "CL-1103",
    practitionerSlug: "dr-ali",
    slotId: "slot-21",
    clientName: "Zainab Malik",
    clientContact: "0300 6677889",
    concern: "Ongoing support after a recent loss.",
    date: "2026-09-26",
    startTime: "12:00",
    endTime: "12:50",
    sessionType: "offline",
    status: "confirmed",
    createdAt: "2026-09-22T09:20:00",
  },
  {
    id: "appt-mock-26b",
    clientId: "CL-1104",
    practitionerSlug: "dr-ali",
    slotId: "slot-23",
    clientName: "Ahsan Iqbal",
    clientContact: "0300 1122334",
    concern: "Managing exam-related anxiety.",
    date: "2026-09-26",
    startTime: "16:00",
    endTime: "16:50",
    sessionType: "online",
    status: "confirmed",
    createdAt: "2026-09-22T14:05:00",
  },
  {
    id: "appt-mock-24",
    clientId: "CL-1101",
    practitionerSlug: "dr-ali",
    slotId: "slot-9",
    clientName: "Hina Raza",
    clientContact: "0300 8899001",
    concern: "Follow-up on sleep and anxiety.",
    date: "2026-09-24",
    startTime: "11:30",
    endTime: "12:20",
    sessionType: "online",
    status: "confirmed",
    createdAt: "2026-09-20T10:00:00",
  },
  {
    id: "appt-mock-25",
    clientId: "CL-1102",
    practitionerSlug: "dr-ali",
    slotId: "slot-14",
    clientName: "Omar Farooq",
    clientContact: "0300 2233445",
    concern: "First consultation about work-life balance.",
    date: "2026-09-25",
    startTime: "13:00",
    endTime: "13:50",
    sessionType: "offline",
    status: "confirmed",
    createdAt: "2026-09-21T15:30:00",
  },
  {
    id: "appt-1",
    clientId: "CL-1001",
    practitionerSlug: "dr-ali",
    slotId: "slot-4",
    clientName: "Sara Ahmed",
    clientContact: "0300 1234567",
    concern: "Feeling overwhelmed with work stress lately, hoping to talk it through.",
    date: "2026-09-20",
    startTime: "15:00",
    endTime: "15:50",
    sessionType: "online",
    status: "pending",
    createdAt: "2026-09-15T09:10:00",
  },
  {
    id: "appt-overdue-demo",
    clientId: "CL-1000",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Junaid Aslam (overdue demo)",
    clientContact: "0300 4455667",
    date: "2026-09-08",
    startTime: "12:00",
    endTime: "12:50",
    sessionType: "online",
    status: "confirmed",
    createdAt: "2026-09-01T10:00:00",
  },
  {
    id: "appt-2",
    clientId: "CL-1002",
    practitionerSlug: "dr-ali",
    slotId: "slot-5",
    clientName: "Bilal Khan",
    clientContact: "0300 7654321",
    date: "2026-09-21",
    startTime: "09:00",
    endTime: "09:50",
    sessionType: "offline",
    status: "confirmed",
    createdAt: "2026-09-13T11:30:00",
  },
  {
    id: "appt-3",
    clientId: "CL-1003",
    practitionerSlug: "dr-ali",
    slotId: "slot-6",
    clientName: "Mariam Sheikh",
    clientContact: "0300 5551234",
    date: "2026-09-15",
    startTime: "17:00",
    endTime: "17:50",
    sessionType: "online",
    status: "confirmed",
    createdAt: "2026-09-14T08:00:00",
  },
  {
    id: "appt-4",
    clientId: "CL-1004",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Hina Rizvi",
    clientContact: "0300 9988776",
    date: "2026-09-10",
    startTime: "11:00",
    endTime: "11:50",
    sessionType: "online",
    status: "completed",
    createdAt: "2026-09-05T10:00:00",
  },
  {
    id: "appt-5",
    clientId: "CL-1005",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Omar Farooq",
    clientContact: "0300 1122334",
    date: "2026-09-12",
    startTime: "16:00",
    endTime: "16:50",
    sessionType: "offline",
    status: "cancelled",
    createdAt: "2026-09-08T14:20:00",
  },
  {
    id: "appt-6",
    clientId: "CL-1006",
    practitionerSlug: "omar-siddiqui",
    slotId: null,
    clientName: "Fatima Noor",
    clientContact: "0300 4432211",
    date: "2026-08-05",
    startTime: "10:00",
    endTime: "10:50",
    sessionType: "offline",
    status: "completed",
    createdAt: "2026-08-01T09:00:00",
  },
  {
    id: "appt-7",
    clientId: "CL-1007",
    practitionerSlug: "omar-siddiqui",
    slotId: null,
    clientName: "Ahmed Raza",
    clientContact: "0300 6677889",
    date: "2026-08-12",
    startTime: "14:00",
    endTime: "14:50",
    sessionType: "offline",
    status: "cancelled",
    createdAt: "2026-08-09T13:00:00",
  },
  {
    id: "appt-8",
    clientId: "CL-1008",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Zara Malik",
    clientContact: "0300 3345678",
    concern: "Struggling with sleep and racing thoughts before bed, would like some coping strategies.",
    date: "2026-09-26",
    startTime: "13:00",
    endTime: "13:50",
    sessionType: "offline",
    status: "pending",
    createdAt: "2026-09-19T16:45:00",
  },
  {
    id: "appt-9",
    clientId: "CL-1009",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Usman Tariq",
    clientContact: "0300 8890011",
    concern: "First time considering therapy, dealing with anxiety around an upcoming job change.",
    date: "2026-09-28",
    startTime: "10:00",
    endTime: "10:50",
    sessionType: "online",
    status: "pending",
    createdAt: "2026-09-20T12:15:00",
  },
  {
    id: "appt-10",
    clientId: "CL-1010",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Ayesha Kamal",
    clientContact: "0300 2213344",
    concern: "Going through a difficult breakup, would like to talk through some of the grief.",
    date: "2026-09-29",
    startTime: "11:00",
    endTime: "11:50",
    sessionType: "online",
    status: "pending",
    createdAt: "2026-09-20T09:05:00",
  },
  {
    id: "appt-11",
    clientId: "CL-1011",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Hamza Siddiqui",
    clientContact: "0300 7789012",
    concern: "Panic attacks have gotten more frequent over the last month, not sure what's triggering them.",
    date: "2026-09-30",
    startTime: "16:00",
    endTime: "16:50",
    sessionType: "offline",
    status: "pending",
    createdAt: "2026-09-18T14:30:00",
  },
  {
    id: "appt-12",
    clientId: "CL-1012",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Nida Farooqi",
    clientContact: "0300 5567890",
    concern: "Constant comparison with peers on social media is affecting my self-esteem.",
    date: "2026-10-01",
    startTime: "14:00",
    endTime: "14:50",
    sessionType: "online",
    status: "pending",
    createdAt: "2026-09-17T10:20:00",
  },
  {
    id: "appt-13",
    clientId: "CL-1013",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Bilal Ahmed",
    clientContact: "0300 3321987",
    concern: "Recently diagnosed with ADHD as an adult, looking for help adjusting.",
    date: "2026-10-02",
    startTime: "09:00",
    endTime: "09:50",
    sessionType: "offline",
    status: "pending",
    createdAt: "2026-09-16T17:50:00",
  },
  {
    id: "appt-14",
    clientId: "CL-1014",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Sana Riaz",
    clientContact: "0300 9012345",
    concern: "Caring for an aging parent full-time and feeling burnt out.",
    date: "2026-10-03",
    startTime: "15:00",
    endTime: "15:50",
    sessionType: "online",
    status: "pending",
    createdAt: "2026-09-20T18:40:00",
  },
  {
    id: "appt-15",
    clientId: "CL-1015",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Faisal Mehmood",
    clientContact: "0300 6654321",
    concern: "Struggling to set boundaries at work, ending up overcommitted every week.",
    date: "2026-10-05",
    startTime: "12:00",
    endTime: "12:50",
    sessionType: "offline",
    status: "pending",
    createdAt: "2026-09-15T13:10:00",
  },
  {
    id: "appt-16",
    clientId: "CL-1016",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Mahnoor Aslam",
    clientContact: "0300 4498765",
    concern: "New mother experiencing what might be postpartum anxiety, would like to talk to someone.",
    date: "2026-10-06",
    startTime: "10:00",
    endTime: "10:50",
    sessionType: "online",
    status: "pending",
    createdAt: "2026-09-19T08:15:00",
  },
  {
    id: "appt-17",
    clientId: "CL-1017",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Danish Iqbal",
    clientContact: "0300 1187654",
    concern: "Struggling with motivation and focus since switching to remote work.",
    date: "2026-10-07",
    startTime: "17:00",
    endTime: "17:50",
    sessionType: "offline",
    status: "pending",
    createdAt: "2026-09-14T11:25:00",
  },
  {
    id: "appt-18",
    clientId: "CL-1018",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Rabia Yousaf",
    clientContact: "0300 8823456",
    concern: "Persistent worry about health that doesn't seem to match what doctors are telling me.",
    date: "2026-10-08",
    startTime: "13:00",
    endTime: "13:50",
    sessionType: "online",
    status: "pending",
    createdAt: "2026-09-13T15:55:00",
  },
  {
    id: "appt-19",
    clientId: "CL-1019",
    practitionerSlug: "dr-ali",
    slotId: null,
    clientName: "Adeel Chaudhry",
    clientContact: "0300 2298765",
    concern: "Considering a big career change and feeling stuck weighing the decision.",
    date: "2026-10-09",
    startTime: "11:00",
    endTime: "11:50",
    sessionType: "offline",
    status: "pending",
    createdAt: "2026-09-12T09:40:00",
  },
];

let nextId = APPOINTMENTS.length + 1;
let nextClientId = 1020;

export async function getAppointmentsByPractitioner(
  slug: string,
  status?: AppointmentStatus,
): Promise<Appointment[]> {
  return APPOINTMENTS.filter(
    (a) => a.practitionerSlug === slug && (!status || a.status === status),
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  return APPOINTMENTS.find((a) => a.id === id) ?? null;
}

// ---- Super Admin ----

export async function getAllAppointments(): Promise<Appointment[]> {
  return [...APPOINTMENTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createAppointmentFromSlot(input: {
  slotId: string;
  clientName: string;
  clientContact: string;
  concern?: string;
  /** The format the client picked — only used when the slot offers both. */
  sessionType?: BookedSessionType;
}): Promise<Appointment | null> {
  const slot = await getSlotById(input.slotId);
  if (!slot || slot.status !== "open") return null;

  await setSlotStatus(slot.id, "booked");

  const appointment: Appointment = {
    id: `appt-${nextId++}`,
    clientId: `CL-${nextClientId++}`,
    practitionerSlug: slot.practitionerSlug,
    slotId: slot.id,
    clientName: input.clientName,
    clientContact: input.clientContact,
    concern: input.concern,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    sessionType: resolveSessionType(slot.sessionType, input.sessionType),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  APPOINTMENTS.push(appointment);
  return appointment;
}

/** Practitioner manually scheduling a session on a client's behalf (phone/walk-in booking) —
 * lands straight in "confirmed" since it never needs the practitioner's own approval. */
export async function createManualAppointment(
  input: {
    practitionerSlug: string;
    clientName: string;
    clientContact: string;
  } & (
    | { slotId: string; sessionType?: BookedSessionType }
    | { date: string; startTime: string; endTime: string; sessionType: "online" | "offline" }
  ),
): Promise<Appointment | null> {
  let date: string;
  let startTime: string;
  let endTime: string;
  let sessionType: "online" | "offline";
  let slotId: string | null = null;

  if ("slotId" in input) {
    const slot = await getSlotById(input.slotId);
    if (!slot || slot.status !== "open") return null;
    await setSlotStatus(slot.id, "booked");
    slotId = slot.id;
    date = slot.date;
    startTime = slot.startTime;
    endTime = slot.endTime;
    sessionType = resolveSessionType(slot.sessionType, input.sessionType);
  } else {
    date = input.date;
    startTime = input.startTime;
    endTime = input.endTime;
    sessionType = input.sessionType;
  }

  const appointment: Appointment = {
    id: `appt-${nextId++}`,
    clientId: `CL-${nextClientId++}`,
    practitionerSlug: input.practitionerSlug,
    slotId,
    clientName: input.clientName,
    clientContact: input.clientContact,
    date,
    startTime,
    endTime,
    sessionType,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
  APPOINTMENTS.push(appointment);
  return appointment;
}

export async function deleteAppointment(id: string): Promise<void> {
  const index = APPOINTMENTS.findIndex((a) => a.id === id);
  if (index !== -1) APPOINTMENTS.splice(index, 1);
}

export async function setAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment | null> {
  const appointment = APPOINTMENTS.find((a) => a.id === id);
  if (!appointment) return null;

  // Cancelling or declining releases the held slot back to the public calendar.
  if (status === "cancelled" && appointment.slotId) {
    await setSlotStatus(appointment.slotId, "open");
  }
  appointment.status = status;
  return appointment;
}

export async function rescheduleAppointment(
  id: string,
  next: { slotId: string } | { date: string; startTime: string; endTime: string; sessionType: "online" | "offline" },
): Promise<Appointment | null> {
  const appointment = APPOINTMENTS.find((a) => a.id === id);
  if (!appointment) return null;

  if (appointment.slotId) {
    await setSlotStatus(appointment.slotId, "open");
  }

  if ("slotId" in next) {
    const slot = await getSlotById(next.slotId);
    if (!slot) return null;
    await setSlotStatus(slot.id, "booked");
    appointment.slotId = slot.id;
    appointment.date = slot.date;
    appointment.startTime = slot.startTime;
    appointment.endTime = slot.endTime;
    // A slot that offers both keeps the format the client already had.
    appointment.sessionType = resolveSessionType(slot.sessionType, appointment.sessionType);
  } else {
    appointment.slotId = null;
    appointment.date = next.date;
    appointment.startTime = next.startTime;
    appointment.endTime = next.endTime;
    appointment.sessionType = next.sessionType;
  }
  return appointment;
}

/** Re-points a practitioner's appointments at their new slug after a rename. */
export async function renameAppointmentSlug(from: string, to: string): Promise<void> {
  for (const a of APPOINTMENTS) if (a.practitionerSlug === from) a.practitionerSlug = to;
}
