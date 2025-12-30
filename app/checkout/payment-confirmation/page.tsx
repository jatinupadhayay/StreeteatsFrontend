import { Suspense } from "react"
import PaymentConfirmationClient from "./PaymentConfirmationClient"

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PaymentConfirmationClient />
    </Suspense>
  )
}
