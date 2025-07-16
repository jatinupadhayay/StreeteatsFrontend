"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type UserRole = "customer" | "vendor" | "delivery"

interface User {

  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  isApproved?: boolean
  profileImage?: string
  _id:string
}

interface AuthContextType {
  user: User | null
  userRole: UserRole
  login: (email: string, password: string, role: UserRole) => Promise<boolean>
  register: (userData: any, role: UserRole) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole>("customer")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

  useEffect(() => {
    const token = localStorage.getItem("streetEatsToken")
    const storedUser = localStorage.getItem("streetEatsUser")
    const storedRole = localStorage.getItem("streetEatsRole")

    if (token && storedUser && storedRole) {
      console.log()
      setUser(JSON.parse(storedUser))
      
      setUserRole(storedRole as UserRole)
      
    }
    setIsLoading(false)
  }, [])
  console.log("user",user)

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`)
      return response.ok
    } catch (error) {
      console.error("Backend connection failed:", error)
      return false
    }
  }

  const register = async (userData: any, role: UserRole): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    const isBackendRunning = await testBackendConnection()
    if (!isBackendRunning) {
      setError(`❌ Backend not running at ${API_BASE}`)
      setIsLoading(false)
      return false
    }

    try {
      const endpoint =
        role === "customer"
          ? "register/customer"
          : role === "vendor"
          ? "register/vendor"
          : "register/delivery"

      console.log(`🔄 Attempting registration at: ${API_BASE}/auth/${endpoint}`)

      const response = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: "POST",
        headers:
          role === "customer"
            ? { "Content-Type": "application/json" }
            : undefined,
        body: role === "customer" ? JSON.stringify(userData) : userData,
      })

      const data = await response.json()
      console.log("📦 Response data:", data)

      if (response.ok) {
        if (role === "customer") {
          setUser(data.user)
          setUserRole(role)
          localStorage.setItem("streetEatsToken", data.token)
          localStorage.setItem("streetEatsUser", JSON.stringify(data.user))
          localStorage.setItem("streetEatsRole", role)
        }
        setIsLoading(false)
        return true
      } else {
        setError(data.message || "Registration failed")
        setIsLoading(false)
        return false
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(`❌ Network error: ${error.message}`)
      setIsLoading(false)
      return false
    }
  }

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    const isBackendRunning = await testBackendConnection()
    if (!isBackendRunning) {
      setError(`❌ Backend not running at ${API_BASE}`)
      setIsLoading(false)
      return false
    }

    try {
      console.log("🔐 Sending login request:", { email, password, role })

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await response.json()
      console.log("📦 Login response:", data)

      if (response.ok) {
        setUser(data.user)
        setUserRole(role)
        localStorage.setItem("streetEatsToken", data.token)
        localStorage.setItem("streetEatsUser", JSON.stringify(data.user))
        localStorage.setItem("streetEatsRole", role)
        setIsLoading(false)
        return true
      } else {
        setError(data.message || "Login failed")
        setIsLoading(false)
        return false
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setError("❌ Login failed due to network or server issue.")
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setUserRole("customer")
    setError(null)
    localStorage.removeItem("streetEatsToken")
    localStorage.removeItem("streetEatsUser")
    localStorage.removeItem("streetEatsRole")
  }

  return (
    <AuthContext.Provider value={{ user, userRole, login, register, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
