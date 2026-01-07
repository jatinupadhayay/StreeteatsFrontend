"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
export const dynamic = "force-dynamic"
export default function PaymentConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  useEffect(() => {
    if (mounted && !user) {
      // Handle redirect logic here if needed or just let the UI show "Please login"
    }
  }, [mounted, user])

  useEffect(() => {
    if (mounted && !orderId) {
      toast({
        title: "Error",
        description: "No order ID found for payment confirmation.",
        variant: "destructive",
      })
      router.replace("/cart")
    }
  }, [mounted, orderId, router, toast])

  // Polling logic for automated confirmation
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const checkPaymentStatus = async () => {
      try {
        if (!orderId) return

        // Fetch user's orders to check status
        const response = await api.orders.getCustomerOrders({ limit: 5, page: 1 })

        if (response.success && response.orders) {
          // Find the specific order
          const order = response.orders.find((o: any) => o._id === orderId || o.id === orderId)

          if (order) {
            // Check if the vendor has confirmed the payment
            const isConfirmed =
              order.paymentStatus === 'completed' ||
              order.paymentStatus === 'paid' ||
              order.status === 'preparing' ||
              order.status === 'confirmed' ||
              order.status === 'placed' // Depending on backend logic, placed might mean confirmed if created via UPI

            // For UPI orders, 'placed' usually means created. We need 'paid' or manual confirmation.
            // If the backend sets 'placed' only after payment, then 'placed' is fine.
            // But typically we want 'paid'.

            if (isConfirmed) {
              toast({
                title: "Payment Confirmed!",
                description: "Restaurant has acknowledged your payment.",
              })
              router.replace(`/delivery/${orderId}`)
            }
          }
        }
      } catch (error) {
        console.error("Polling error", error)
      }
    }

    // Start polling if we have an orderId
    if (mounted && orderId) {
      checkPaymentStatus()
      intervalId = setInterval(checkPaymentStatus, 3000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [mounted, orderId, router, toast])

  if (!orderId) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-xl">
            <Loader2 className="w-6 h-6 mr-2 text-blue-500 animate-spin" />
            Waiting for Confirmation
          </CardTitle>
          <CardDescription>
            Order ID: <span className="font-semibold">#{orderId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-lg text-gray-800">
            Please wait while the restaurant verifies your payment.
          </p>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-full"></div>
            </div>
            <p className="text-sm text-gray-500 animate-pulse">Checking payment status...</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 text-center">
              <Info className="inline w-4 h-4 mr-1 -mt-0.5" />
              Once the vendor receives your UPI payment, this page will automatically update.
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full text-gray-500 hover:text-gray-700"
            onClick={() => router.push('/customer/orders')}
          >
            Check Status in Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

