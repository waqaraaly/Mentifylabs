/**
 * Stand-in for a real Super Admin account + settings table. Same async shape as the other
 * data modules so it can move to D1 without touching call sites.
 */
export interface AdminSettings {
  name: string;
  email: string;
  /** Pre-ticks "Skip verification" when Super Admin adds a practitioner manually. */
  skipVerificationByDefault: boolean;
  notifyNewSignup: boolean;
  notifyProfileSubmitted: boolean;
  notifyDailyDigest: boolean;
}

const SETTINGS: AdminSettings = {
  name: "Super Admin",
  email: "admin@mentifylabs.com",
  skipVerificationByDefault: true,
  notifyNewSignup: true,
  notifyProfileSubmitted: true,
  notifyDailyDigest: false,
};

let password = "admin-password-123";

export async function getAdminSettings(): Promise<AdminSettings> {
  return { ...SETTINGS };
}

export async function updateAdminSettings(updates: Partial<AdminSettings>): Promise<AdminSettings> {
  Object.assign(SETTINGS, updates);
  return { ...SETTINGS };
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  if (currentPassword !== password) return { ok: false, message: "Current password is incorrect." };
  if (newPassword.length < 8) return { ok: false, message: "New password must be at least 8 characters." };
  if (newPassword === currentPassword) return { ok: false, message: "Choose a different password from the current one." };
  password = newPassword;
  return { ok: true, message: "Password updated." };
}
