import { redirect } from "next/navigation";

// Excludes this specific file from Instant Navigation validation checks
export const instant = false;

export default function HomePage() {
  redirect("/dashboard");
}
