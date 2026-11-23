export async function register(): Promise<void> {
  // Only run in the Node.js server runtime (not in the edge runtime).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./config/env");
    validateEnv();
  }
}
