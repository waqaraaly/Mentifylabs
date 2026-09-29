"use client";

import { useEffect } from "react";

// Only fires when the root layout itself throws, so unlike error.tsx it
// must render its own <html>/<body> — it replaces the layout entirely.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          background: "#f0f3ef",
          color: "#1b231e",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "6rem 1.5rem" }}>
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.15em", color: "#59655d", textTransform: "uppercase" }}>
            MentifyLabs
          </p>
          <h1 style={{ marginTop: "1.5rem", fontSize: 36, lineHeight: 1.15 }}>Something went wrong.</h1>
          <p style={{ marginTop: "1.5rem", maxWidth: 420, fontSize: 18, color: "#59655d" }}>
            Our side, not yours. Try again, and if it keeps happening, let us know.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "2.5rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 8,
              background: "#3b6651",
              padding: "0.75rem 1.5rem",
              fontSize: 14,
              fontWeight: 600,
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
