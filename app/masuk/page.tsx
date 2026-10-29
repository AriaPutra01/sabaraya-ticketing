import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const instant = false;

export default async function MasukPage() {
  await connection();

  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
