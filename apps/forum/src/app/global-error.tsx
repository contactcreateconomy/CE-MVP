"use client";

import { useEffect } from "react";

/**
 * Catches errors in the root layout (including providers). Must define html/body.
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0a0a0a", color: "#fafafa" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>Something went wrong</h1>
            <p style={{ fontSize: "0.875rem", opacity: 0.85, marginBottom: "1.25rem" }}>
              An unexpected error occurred while loading the app. Check the browser console for details.
              {error.digest ? ` (digest: ${error.digest})` : null}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                borderRadius: "9999px",
                border: "1px solid #3f3f46",
                background: "#18181b",
                color: "#fafafa",
                padding: "0.5rem 1.25rem",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
