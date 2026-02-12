"use client"

import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "./AuthProvider"

import { useSession } from "next-auth/react"

// List of public routes that don't require auth
const PUBLIC_PATHS = ["/", "/login", "/signup", "/api"]

export default function AuthGate() {
  const { isAuthenticated, loading: localLoading } = useAuth()
  const { status: sessionStatus } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Wait for both local auth and NextAuth to finish loading
    if (localLoading || sessionStatus === "loading") {
      console.log("AuthGate waiting...", { localLoading, sessionStatus });
      return;
    }

    // allow paths that start with any of PUBLIC_PATHS (e.g. /api/*)
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))

    // Check if authenticated via NextAuth (Google) or LocalStorage
    const isNextAuthAuthenticated = sessionStatus === "authenticated";

    console.log("AuthGate check:", {
      pathname,
      isPublic,
      isAuthenticated,
      isNextAuthAuthenticated,
      sessionStatus
    });

    // Only redirect if NOT public and NOT authenticated by either method
    if (!isPublic && !isAuthenticated && !isNextAuthAuthenticated) {
      console.log("AuthGate redirecting to login from", pathname);
      // redirect to login, preserve return url
      const returnTo = encodeURIComponent(pathname || "/")
      router.push(`/login?next=${returnTo}`)
    }
  }, [localLoading, sessionStatus, isAuthenticated, pathname, router])

  return null
}
