"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/AuthContext"
import CustomerRegistration from "@/components/auth/CustomerRegistration"
import VendorRegistration from "@/components/auth/VendorRegistration"
import DeliveryRegistration from "@/components/auth/DeliveryRegistration"
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal"

type UserRole = "customer" | "vendor" | "delivery"

const displayRole: Record<UserRole, string> = {
  customer: "Customer",
  vendor: "Vendor",
  delivery: "Delivery Partner"
}

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer")
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const { login, isLoading, error, user, userRole } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  React.useEffect(() => {
    const mode = searchParams.get("mode")
    if (mode === "register") {
      setAuthMode("register")
    } else if (mode === "login") {
      setAuthMode("login")
    }
  }, [searchParams])

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const target =
        userRole === "vendor"
          ? "/vendor"
          : userRole === "delivery"
            ? "/delivery"
            : "/customer"
      router.replace(target)
    }
  }, [user, userRole, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(email, password, selectedRole)
    if (!success) {
      // Error is handled in AuthContext
    }
  }

  const handleRegistrationSuccess = () => {
    // Registration successful - you can redirect or show success
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-4">
      <div className="w-full max-w-4xl">
        <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* LOGIN TAB */}
          <TabsContent value="login">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader className="text-center">
                <img src="/image.png" alt="Aahar Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
                <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
                <CardDescription className="text-gray-600">Choose your role and sign in to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="customer">Customer</TabsTrigger>
                    <TabsTrigger value="vendor">Vendor</TabsTrigger>
                    <TabsTrigger value="delivery">Delivery</TabsTrigger>
                  </TabsList>

                  {error && (
                    <Alert className="mb-4 border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <div className="flex justify-end py-1">
                      <button
                        type="button"
                        onClick={() => setIsForgotModalOpen(true)}
                        className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
                      {isLoading
                        ? "Signing In..."
                        : `Sign In as ${displayRole[selectedRole]}`}
                    </Button>
                  </form>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REGISTRATION TAB */}
          <TabsContent value="register">
            <div className="flex justify-center">
              <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="customer">Customer</TabsTrigger>
                  <TabsTrigger value="vendor">Vendor</TabsTrigger>
                  <TabsTrigger value="delivery">Delivery</TabsTrigger>
                </TabsList>

                <TabsContent value="customer">
                  <CustomerRegistration onSuccess={handleRegistrationSuccess} />
                </TabsContent>

                <TabsContent value="vendor">
                  <VendorRegistration onSuccess={handleRegistrationSuccess} />
                </TabsContent>

                <TabsContent value="delivery">
                  <DeliveryRegistration onSuccess={handleRegistrationSuccess} />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        role={selectedRole}
      />
    </div>
  )
}
