"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { handleFromName } from "@/lib/handleFromName";

/** Type your name, see the address it would make, and carry the name into sign-up. Nothing is sent until they press Claim. */
export function ClaimField() {
  const [name, setName] = useState("");
  const router = useRouter();
  const handle = handleFromName(name);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim().slice(0, 120);
    router.push(trimmed ? `/signup?name=${encodeURIComponent(trimmed)}` : "/signup");
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-lg">
      <div className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-[0_18px_34px_-22px_rgba(31,38,23,0.5)] ring-1 ring-(--hair) focus-within:ring-2 focus-within:ring-(--leaf)">
        <label htmlFor="claim-name" className="sr-only">
          Your name
        </label>
        <input
          id="claim-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoComplete="off"
          placeholder="Dr. Ayesha Khan"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-(--quiet)/50"
        />
        <button type="submit" className="shrink-0 rounded-full bg-(--ink) px-5 py-3 text-sm font-medium text-white transition hover:bg-(--moss)">
          Claim
        </button>
      </div>
      <p className="mt-3 truncate text-center font-mono text-[13px] text-(--quiet)">
        mentifylabs.com/<span className="font-semibold text-(--ink)">{handle || "your-name"}</span>
      </p>
      <p className="mt-1 text-center text-[13px] text-(--quiet)">You choose your final link when you set up.</p>
    </form>
  );
}
