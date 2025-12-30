"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

export default function PaymentConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "No order ID found for payment confirmation.",
        variant: "destructive",
      })
      router.replace("/cart")
    }
  }, [orderId, router, toast])

  const handlePaymentConfirmation = async (confirmed: boolean) => {
    if (!orderId) return
    setIsLoading(true)

    try {
      const response = await api.payments.confirmUpiPayment(orderId, confirmed)
      
      if (response.success) {
        if (confirmed) {
          toast({
            title: "Payment Confirmed!",
            description: "Your payment is being verified by the restaurant.",
          })
          router.replace(`/delivery/${orderId}`)
        } else {
          toast({
            title: "Payment Marked as Failed",
            description: "Please try another payment method or contact support.",
            variant: "destructive",
          })
          router.replace(`/checkout?orderId=${orderId}&status=failed`)
        }
      } else {
        throw new Error(response.message || "Failed to update payment status.")
      }
    } catch (error: any) {
      console.error("Payment confirmation error:", error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong during confirmation.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
            <Info className="w-6 h-6 mr-2 text-blue-500" />
            Confirm UPI Payment
          </CardTitle>
          <CardDescription>
            Order ID: <span className="font-semibold">#{orderId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-lg text-gray-800">
            Have you completed the UPI payment to the restaurant?
          </p>
          <p className="text-sm text-gray-600 text-center">
            <Info className="inline w-3 h-3 mr-1" /> Please ensure you have successfully transferred the amount.
            The restaurant will verify your payment after order placement.
          </p>
          <div className="flex flex-col space-y-3">
            <Button
              onClick={() => handlePaymentConfirmation(true)}
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              YES, PAYMENT DONE
            </Button>
            <Button
              onClick={() => handlePaymentConfirmation(false)}
              disabled={isLoading}
              variant="outline"
              className="w-full border-red-500 text-red-500 hover:bg-red-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              PAYMENT FAILED
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

