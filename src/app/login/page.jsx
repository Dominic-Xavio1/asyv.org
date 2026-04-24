'use client'
import { LoginForm } from "@/components/login-form"
import { Suspense } from "react";
export default function LoginPage() {
  return (
    <div
      className="bg-muted flex min-h-svh flex-col items-center justify-center p-6  md:p-10 dark:bg-gray-900">
      <div className="w-full max-w-sm md:max-w-6xl">
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
