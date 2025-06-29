"use server"

import { cookies } from "next/headers"

export async function createPaymentOrder(orderData: {
  amount: number
  orderId: string
  currency?: string
}) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    const response = await fetch(`${process.env.API_URL}/payments/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...orderData,
        currency: orderData.currency || "INR",
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to create payment order")
    }

    const result = await response.json()

    // Return only safe data to client (no sensitive keys)
    return {
      success: true,
      data: {
        orderId: result.orderId,
        amount: result.amount,
        currency: result.currency,
        // Razorpay key is handled securely on server
      },
    }
  } catch (error) {
    console.error("Payment order creation failed:", error)
    return {
      success: false,
      error: "Failed to create payment order",
    }
  }
}

export async function verifyPayment(paymentData: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  orderId: string
}) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    const response = await fetch(`${process.env.API_URL}/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      throw new Error("Payment verification failed")
    }

    const result = await response.json()
    return { success: true, data: result }
  } catch (error) {
    console.error("Payment verification failed:", error)
    return {
      success: false,
      error: "Payment verification failed",
    }
  }
}

// Server action to get Razorpay config (secure)
export async function getRazorpayConfig() {
  try {
    const response = await fetch(`${process.env.API_URL}/payments/config`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get payment config")
    }

    const config = await response.json()
    return { success: true, data: config }
  } catch (error) {
    return {
      success: false,
      error: "Failed to get payment config",
    }
  }
}
