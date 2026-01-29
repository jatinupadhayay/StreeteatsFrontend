"use client"

import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/contexts/AuthContext"
import AuthPage from "@/components/common/AuthPage"

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}

function HomeContent() {
  const { user, userRole } = useAuth()
  const router = useRouter()

  if (!user) {
    return <AuthPage />
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const target =
      userRole === "vendor"
        ? "/vendor"
        : userRole === "delivery"
          ? "/delivery"
          : "/customer"

    router.replace(target)
  }, [router, userRole])

  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50">
      <div className="text-center">
        <p className="text-sm font-medium text-orange-600">Loading dashboard…</p>
      </div>
    </div>
  )
}
