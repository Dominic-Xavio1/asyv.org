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
    if (localLoading || sessionStatus === "loading") return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
    const isNextAuthAuthenticated = sessionStatus === "authenticated";

    if (!isPublic && !isAuthenticated && !isNextAuthAuthenticated) {
      const returnTo = encodeURIComponent(pathname || "/")
      router.push(`/login?next=${returnTo}`)
    }
  }, [localLoading, sessionStatus, isAuthenticated, pathname, router])

  return null
}