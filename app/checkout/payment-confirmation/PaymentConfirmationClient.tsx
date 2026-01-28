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
  const { toast } = useToast()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [vendorUpi, setVendorUpi] = useState<{ upiId: string; upiName: string } | null>(null)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch order and vendor details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!mounted || !orderId) return
      try {
        const response = await api.orders.getById(orderId)
        if (response.success && response.order) {
          const order = response.order
          setTotalAmount(order.pricing.total)
          // Access vendor details from order.vendor which is populated in backend
          const vendor = order.vendor as any
          if (vendor?.upiPayment?.enabled) {
            setVendorUpi({
              upiId: vendor.upiPayment.upiId,
              upiName: vendor.upiPayment.upiName
            })
          }
        }
      } catch (error) {
        console.error("Error fetching order for QR:", error)
      }
    }
    fetchOrderDetails()
  }, [mounted, orderId])

  // Generate QR Code URL
  useEffect(() => {
    if (vendorUpi && orderId && totalAmount > 0) {
      const upiUrl = `upi://pay?pa=${vendorUpi.upiId}&pn=${encodeURIComponent(vendorUpi.upiName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=Order-${orderId}`
      const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(upiUrl)}&size=300&margin=1`
      setQrCodeUrl(qrUrl)
    }
  }, [vendorUpi, orderId, totalAmount])

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

  if (!mounted) return null

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
          <CardTitle className="flex items-center justify-center text-xl text-orange-800">
            <Loader2 className="w-6 h-6 mr-2 text-orange-500 animate-spin" />
            Waiting for Confirmation
          </CardTitle>
          <CardDescription>
            Order ID: <span className="font-semibold">#{orderId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {qrCodeUrl && (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 bg-white rounded-xl border-2 border-orange-100 shadow-sm">
                <img src={qrCodeUrl} alt="UPI QR" width={200} height={200} className="rounded-lg" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Pay ₹{totalAmount.toFixed(2)} via UPI</p>
                <p className="text-xs text-gray-500 mt-1">{vendorUpi?.upiId}</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 text-center flex items-center justify-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              Once you pay, please wait exactly here. The restaurant will verify and your order will auto-update.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-orange-500 h-full rounded-full animate-progress-fast"></div>
            </div>
            <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Verifying Transaction...</p>
          </div>

          <Button
            variant="outline"
            className="w-full border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            onClick={() => router.push('/customer/orders')}
          >
            Go to My Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
