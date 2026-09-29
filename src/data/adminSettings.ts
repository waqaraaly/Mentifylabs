import { first } from "@/lib/db";
import { changePassword, requireAdmin } from "@/lib/session";

export interface AdminSettings {
  name: string;
  email: string;
  /** Pre-ticks "Skip verification" when Super Admin adds a practitioner manually. */
  skipVerificationByDefault: boolean;
  notifyNewSignup: boolean;
  notifyProfileSubmitted: boolean;
  notifyDailyDigest: boolean;
}

interface SettingsRow {
  name: string;
  email: string;
  skip_verification_by_default: number;
  notify_new_signup: number;
  notify_profile_submitted: number;
  notify_daily_digest: number;
}

const toSettings = (r: SettingsRow): AdminSettings => ({
  name: r.name,
  email: r.email,
  skipVerificationByDefault: r.skip_verification_by_default === 1,
  notifyNewSignup: r.notify_new_signup === 1,
  notifyProfileSubmitted: r.notify_profile_submitted === 1,
  notifyDailyDigest: r.notify_daily_digest === 1,
});

const flag = (v: boolean | undefined) => (v === undefined ? null : v ? 1 : 0);

export async function getAdminSettings(): Promise<AdminSettings> {
  const row = await first<SettingsRow>("SELECT * FROM admin_settings WHERE id = 1");
  if (!row) throw new Error("Admin settings missing. Run `npm run db:seed:local`.");
  return toSettings(row);
}

export async function updateAdminSettings(updates: Partial<AdminSettings>): Promise<AdminSettings> {
  const row = await first<SettingsRow>(
    `UPDATE admin_settings SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        skip_verification_by_default = COALESCE(?, skip_verification_by_default),
        notify_new_signup = COALESCE(?, notify_new_signup),
        notify_profile_submitted = COALESCE(?, notify_profile_submitted),
        notify_daily_digest = COALESCE(?, notify_daily_digest)
      WHERE id = 1 RETURNING *`,
    updates.name,
    updates.email,
    flag(updates.skipVerificationByDefault),
    flag(updates.notifyNewSignup),
    flag(updates.notifyProfileSubmitted),
    flag(updates.notifyDailyDigest),
  );
  return toSettings(row!);
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  return changePassword(await requireAdmin(), currentPassword, newPassword);
}
