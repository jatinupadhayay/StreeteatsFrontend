"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth} from "@/contexts/AuthContext"
import { useRouter } from "next/navigation" // Import useRouter

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<"customer" | "vendor" | "delivery">("customer")
  const { login, isLoading, error } = useAuth()
  const router = useRouter() // Initialize useRouter

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(email, password, selectedRole)
    if (success) {
      // Redirect based on role after successful login
      if (selectedRole === "customer") {
        router.push("/") // Redirect customer to home
      } else if (selectedRole === "vendor") {
        router.push("/vendor-dashboard") // Redirect vendor to vendor dashboard
      } else if (selectedRole === "delivery") {
        router.push("/delivery-dashboard") // Redirect delivery partner to delivery dashboard
      }
    }
  }

  return (
    <div className="space-y-4">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">SE</span>
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>Choose your role and sign in to continue</CardDescription>
      </CardHeader>
      <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="user">Customer</TabsTrigger>
          <TabsTrigger value="vendor">Vendor</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>

        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
            {isLoading
              ? "Signing In..."
              : `Sign In as ${
                  selectedRole === "customer" ? "Customer" : selectedRole === "vendor" ? "Vendor" : "Delivery Partner"
                }`}
          </Button>
        </form>
      </Tabs>
    </div>
  )
}
