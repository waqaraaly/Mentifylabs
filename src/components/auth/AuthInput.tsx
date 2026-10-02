"use client";

import { useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

export const authInputClass =
  "w-full rounded-xl bg-surface py-3 pr-3.5 pl-11 text-[15px] text-foreground ring-1 ring-border outline-none transition placeholder:text-muted/60 focus:ring-2 focus:ring-primary";

/** Wraps an auth `<input>` with a leading icon; pairs with `authInputClass`,
 * which reserves the left padding for it. Password fields get a show/hide
 * toggle on the right. */
export function AuthInput({
  icon: Icon,
  ...props
}: { icon: LucideIcon } & React.InputHTMLAttributes<HTMLInputElement>) {
  const isPassword = props.type === "password";
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input {...props} type={isPassword && shown ? "text" : props.type} className={`${authInputClass} ${isPassword ? "pr-11" : ""}`} />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      )}
    </div>
  );
}
