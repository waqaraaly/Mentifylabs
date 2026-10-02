import { LoaderScreen } from "@/components/ui/BrainLoader";

/**
 * Fills the gap between the signup redirect landing here and the wizard's
 * own data being ready — the brain alone, dead-center in the window.
 */
export default function Loading() {
  return <LoaderScreen message="Setting up your workspace…" />;
}
