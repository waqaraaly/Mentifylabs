"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { handleFromName } from "@/lib/handleFromName";

/** The hero's main action: type your name, see the address it would make, and carry the name into sign-up. Nothing is sent until they press the button. */
export function HeroClaim() {
  const [name, setName] = useState("");
  const router = useRouter();
  const handle = handleFromName(name);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim().slice(0, 120);
    router.push(trimmed ? `/signup?name=${encodeURIComponent(trimmed)}` : "/signup");
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-[540px]">
      <div className="flex flex-wrap gap-2.5">
        <div className="flex h-14 min-w-0 flex-[1_1_260px] items-center rounded-full bg-white px-5 ring-[1.5px] ring-[#e4e1d3] focus-within:ring-(--leaf)">
          <label htmlFor="hero-name" className="sr-only">
            Your name
          </label>
          <input
            id="hero-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoComplete="off"
            placeholder="Your name, e.g. Dr. Ayesha Khan"
            className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-(--quiet)/60"
          />
        </div>
        <button type="submit" className="h-14 cursor-pointer rounded-full bg-(--ink) px-7 text-base font-semibold text-white transition hover:bg-(--moss)">
          Claim your link
        </button>
      </div>
      <p className="mt-3 truncate pl-5 font-mono text-[13px] text-(--quiet)">
        mentifylabs.com/<span className="font-semibold text-(--ink)">{handle || "your-name"}</span>
      </p>
    </form>
  );
}
