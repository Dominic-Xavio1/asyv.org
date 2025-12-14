"use client"

import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "./AuthProvider"

// List of public routes that don't require auth
const PUBLIC_PATHS = ["/", "/login", "/signup", "/api"]

export default function AuthGate() {
  const { isAuthenticated, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // allow paths that start with any of PUBLIC_PATHS (e.g. /api/*)
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))

    if (!isPublic && !isAuthenticated) {
      // redirect to login, preserve return url
      const returnTo = encodeURIComponent(pathname || "/")
      router.push(`/login?next=${returnTo}`)
    }
  }, [loading, isAuthenticated, pathname, router])

  return null
}
