"use client"

import { useAuth } from "@/contexts/AuthContext"
import UserDashboard from "@/components/user/UserDashboard"
import VendorDashboard from "@/components/vendor/VendorDashboard"
import DeliveryDashboard from "@/components/delivery/DeliveryDashboard"
import AuthPage from "@/components/common/AuthPage"

export default function Home() {
  const { user, userRole } = useAuth()

  if (!user) {
    return <AuthPage />
  }

  switch (userRole) {
    case "vendor":
      return <VendorDashboard />
    case "delivery":
      return <DeliveryDashboard />
    default:
      return <UserDashboard />
  }
}
