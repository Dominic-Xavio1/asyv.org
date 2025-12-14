"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const t = localStorage.getItem("token")
      if (t) setToken(t)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }, [])

  const login = (newToken) => {
    try {
      localStorage.setItem("token", newToken)
    } catch (e) {}
    setToken(newToken)
  }

  const logout = () => {
    try {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
        localStorage.removeItem("fullInfo")
        localStorage.removeItem("second_name")
        localStorage.removeItem("theme")
    } catch (e) {}
    setToken(null)
    router.push("/login")
  }

  const value = {
    token,
    setToken: login,
    login,
    logout,
    loading,
    isAuthenticated: Boolean(token),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export default AuthProvider
