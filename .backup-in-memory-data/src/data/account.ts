/**
 * Stand-in for a real auth/account system. Once auth exists, this becomes
 * the user record in the session/database instead of a module-level object.
 *
 * Everything here belongs to the private account — sign-in, notifications,
 * invoices — and is deliberately separate from the public profile
 * (see Practitioner in src/types), which has its own display name and
 * public contact details.
 */
interface Account {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const ACCOUNT: Account = {
  name: "Ayesha Batool",
  email: "ayesha.batool@example.com",
  phone: "+92 300 1234567",
  password: "password123",
};

export async function getAccount(): Promise<{ name: string; email: string; phone: string }> {
  return { name: ACCOUNT.name, email: ACCOUNT.email, phone: ACCOUNT.phone };
}

export async function updateAccountDetails(details: {
  name: string;
  email: string;
  phone: string;
}): Promise<void> {
  ACCOUNT.name = details.name;
  ACCOUNT.email = details.email;
  ACCOUNT.phone = details.phone;
}

export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  if (currentPassword !== ACCOUNT.password) {
    return { ok: false, message: "Current password is incorrect." };
  }
  if (newPassword.length < 8) {
    return { ok: false, message: "New password must be at least 8 characters." };
  }
  ACCOUNT.password = newPassword;
  return { ok: true, message: "Password updated." };
}
