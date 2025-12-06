// components/auth-modal/AuthModal.jsx
'use client';

import { useState } from "react"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function AuthModal({ onClose, initialMode = "login", onSuccess }) {
  const [isVisible, setIsVisible] = useState(true)
  const [mode, setMode] = useState(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [signupData, setSignupData] = useState({
    full_name: "",
    email: "",
    password: "",
    password_confirm: "",
    role: "alumni"
  })
  const router = useRouter()

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  const handleSwitchMode = (newMode) => {
    setMode(newMode)
    setError("")
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      console.log("Auth Login", loginData)
      handleClose()
      router.push('/feed')
      onSuccess?.()
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      handleClose()
      router.push('/feed')
      onSuccess?.()
    } catch (err) {
      setError(err?.message || "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop with blur and opacity */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 p-4 animate-fadeIn" style={{ marginTop: '140px', marginBottom: '40px' }}>
        <div className="relative w-full max-w-[450px] h-[500px]">
          {/* Login Form */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col gap-6 transition-all duration-500 ease-in-out",
              mode === "login"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 -translate-x-full pointer-events-none"
            )}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <Card className="shadow-lg border-0 h-full">
              <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>
                  Enter your email below to login to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
                <form onSubmit={handleLoginSubmit}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="login-email">Email</FieldLabel>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="m@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      />
                    </Field>
                    <Field>
                      <div className="flex items-center">
                        <FieldLabel htmlFor="login-password">
                          Password
                        </FieldLabel>
                        <a
                          href="#"
                          className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <Input 
                        id="login-password" 
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      />
                    </Field>
                    <Field>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                      </Button>
                      <Button variant="outline" type="button" className="w-full">
                        Login with Google
                      </Button>
                      <FieldDescription className="text-center mt-4">
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          onClick={() => handleSwitchMode("signup")}
                          className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Sign up
                        </button>
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Signup Form */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col gap-6 transition-all duration-500 ease-in-out",
              mode === "signup"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 translate-x-full pointer-events-none"
            )}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 rounded-sm hover:bg-gray-100 transition-colors duration-200 z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <Card className="shadow-lg border-0 h-full overflow-y-auto">
              <CardHeader>
                <CardTitle>Create your account</CardTitle>
                <CardDescription>
                  Join our community and get started today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
                <form onSubmit={handleSignupSubmit}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="signup-name">Full Name</FieldLabel>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signupData.full_name}
                        onChange={(e) => setSignupData({...signupData, full_name: e.target.value})}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="m@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Select Role</FieldLabel>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800"
                        value={signupData.role}
                        onChange={(e) => setSignupData({...signupData, role: e.target.value})}
                      >
                        <option value="" disabled>
                          Select your role
                        </option>
                        <option value="alumni">Alumni</option>
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="visitor">Visitor</option>
                        <option value="mentor">Mentor</option>
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="signup-password">
                        Password
                      </FieldLabel>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a strong password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="signup-confirm">
                        Confirm Password
                      </FieldLabel>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        value={signupData.password_confirm}
                        onChange={(e) => setSignupData({...signupData, password_confirm: e.target.value})}
                      />
                    </Field>
                    <Field>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Signing up..." : "Sign Up"}
                      </Button>
                      <Button variant="outline" type="button" className="w-full">
                        Sign up with Google
                      </Button>
                      <FieldDescription className="text-center mt-4">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => handleSwitchMode("login")}
                          className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Login
                        </button>
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}