"use client"
import { SessionProvider } from "next-auth/react"

export function GoogleProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>
}