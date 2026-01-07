"use client"

import { Wallet as WalletIcon, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Wallet() {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="bg-orange-100 p-6 rounded-full">
        <WalletIcon className="w-16 h-16 text-orange-600" />
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Wallet Services</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          We are building a robust payment and settlement system for you.
          The wallet feature will be available shortly.
        </p>
      </div>

      <Card className="w-full max-w-md border-orange-200 bg-orange-50 shadow-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-orange-800 flex items-center justify-center gap-2">
            <Clock className="w-5 h-5" />
            Coming Soon!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-orange-700">
            Internal payment settlements, daily revenue tracking, and instant withdrawals are being integrated with our banking partners.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
        <FeaturePreview
          title="Instant Payouts"
          description="Withdraw your earnings directly to your bank account anytime."
        />
        <FeaturePreview
          title="Revenue Reports"
          description="Detailed daily, weekly, and monthly statements of your earnings."
        />
        <FeaturePreview
          title="Fraud Protection"
          description="Secure transaction monitoring to ensures your money is always safe."
        />
        <FeaturePreview
          title="Consolidated Billing"
          description="Easy tax-ready invoices for all your platform sales."
        />
      </div>
    </div>
  )
}

function FeaturePreview({ title, description }: { title: string, description: string }) {
  return (
    <div className="p-4 bg-white border rounded-xl shadow-sm">
      <h3 className="font-bold text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  )
}
