import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Register() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Register</h1>
      <p className="mb-6">Registration functionality coming soon.</p>
      <Link href="/login">
        <Button>Back to Login</Button>
      </Link>
    </div>
  );
}