import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/features/auth/components/signup-form";
import { getSession } from "@/server/session";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <SignupForm />;
}
