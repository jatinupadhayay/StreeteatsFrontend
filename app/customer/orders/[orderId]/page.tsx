"use client"

import CustomerOrderTracking from "@/components/user/OrderTrackingPage"

interface OrderTrackingRouteProps {
  params: {
    orderId: string
  }
}

export default function OrderTrackingRoute({ params }: OrderTrackingRouteProps) {
  return <CustomerOrderTracking orderId={params.orderId} />
}

