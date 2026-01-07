"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, CheckCircle, QrCode, Save, Loader2, Info } from "lucide-react"
import Image from "next/image"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"

export default function UpiPaymentSettings() {
  const { user } = useAuth()
  const [upiId, setUpiId] = useState("")
  const [upiName, setUpiName] = useState("")
  const [upiEnabled, setUpiEnabled] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [isValidUpiId, setIsValidUpiId] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [hasExistingSettings, setHasExistingSettings] = useState(false)

  const { toast } = useToast()

  // Fetch UPI settings on component mount
  useEffect(() => {
    const fetchUpiSettings = async () => {
      try {
        const response = await api.vendors.getPaymentSettings()
        if (response.success && response.settings) {
          const settings = response.settings
          setUpiId(settings.upiId || "")
          setUpiName(settings.upiName || "")
          setUpiEnabled(settings.upiEnabled || false)

          // Check if settings exist (UPI ID and Name are set)
          const settingsExist = !!(settings.upiId && settings.upiName)
          setHasExistingSettings(settingsExist)
          // Start in edit mode only if no settings exist
          setIsEditing(!settingsExist)
        }
      } catch (error: any) {
        console.error("Failed to fetch UPI settings:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load UPI settings. Please ensure you're logged in as a vendor.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchUpiSettings()
  }, [toast])

  // Validate UPI ID format
  useEffect(() => {
    const upiRegex = /^[a-zA-Z0-9.\-]+@[a-zA-Z0-9.\-]+$/
    setIsValidUpiId(upiRegex.test(upiId))
  }, [upiId])

  // Generate QR Code URL
  useEffect(() => {
    if (upiEnabled && isValidUpiId && upiName) {
      // Add amount parameter for better UPI app compatibility
      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=&cu=INR&tn=Restaurant%20Payment`

      // Use goqr.me API which is more reliable
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}&format=png`
      setQrCodeUrl(qrApiUrl)

      console.log("QR Code Generated:", qrApiUrl)
    } else {
      setQrCodeUrl("")
    }
  }, [upiId, upiName, upiEnabled, isValidUpiId])

  const handleSaveSettings = async () => {
    if (upiEnabled && (!isValidUpiId || !upiName.trim())) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid UPI ID and Account Holder Name to enable UPI payments.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Update payment settings (vendor ID is automatically determined from auth token)
      const response = await api.vendors.updatePaymentSettings({
        upiId,
        upiName,
        upiEnabled,
      })
      if (response.success) {
        toast({
          title: "Success",
          description: "UPI payment settings saved successfully.",
        })
        setHasExistingSettings(true)
        setIsEditing(false)
      } else {
        throw new Error(response.message || "Failed to save UPI settings.")
      }
    } catch (error: any) {
      console.error("Error saving UPI settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save UPI settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading payment settings...</span>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-6 h-6 mr-2" />
            UPI Payment Settings
          </CardTitle>
          <CardDescription>
            Configure your UPI ID and enable QR code payments for your restaurant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing && hasExistingSettings ? (
            // View Mode - Display saved settings
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <div>
                      <h3 className="font-semibold text-lg">UPI Payment Configured</h3>
                      <p className="text-sm text-gray-600">Your UPI payment settings are active</p>
                    </div>
                  </div>
                  <Badge variant={upiEnabled ? "default" : "secondary"} className={upiEnabled ? "bg-green-500" : ""}>
                    {upiEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="space-y-3 bg-white p-4 rounded-md">
                  <div>
                    <Label className="text-xs text-gray-500">UPI ID</Label>
                    <p className="font-mono text-sm font-medium">{upiId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Account Holder Name</Label>
                    <p className="text-sm font-medium">{upiName}</p>
                  </div>
                </div>

                {upiEnabled && qrCodeUrl && (
                  <div className="mt-4 bg-white p-4 rounded-md flex flex-col items-center">
                    <Label className="text-xs text-gray-500 mb-2">Payment QR Code</Label>
                    <img
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      width={150}
                      height={150}
                      className="w-32 h-32 border border-gray-200 rounded"
                    />
                    <p className="text-xs text-gray-500 mt-2">Customers can scan this to pay</p>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Edit Payment Settings
              </Button>
            </div>
          ) : (
            // Edit Mode - Show form
            <>
              <div>
                <Label htmlFor="upi-id">UPI ID (e.g., yourname@bank)</Label>
                <Input
                  id="upi-id"
                  type="text"
                  placeholder="Enter your UPI ID"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className={!isValidUpiId && upiId.length > 0 ? "border-red-500" : ""}
                />
                {!isValidUpiId && upiId.length > 0 && (
                  <p className="text-red-500 text-sm mt-1">Please enter a valid UPI ID (e.g., example@bank)</p>
                )}
              </div>

              <div>
                <Label htmlFor="upi-name">Account Holder / Restaurant Name</Label>
                <Input
                  id="upi-name"
                  type="text"
                  placeholder="Enter account holder name"
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-upi"
                  checked={upiEnabled}
                  onCheckedChange={setUpiEnabled}
                  disabled={!isValidUpiId || !upiName.trim()}
                />
                <Label htmlFor="enable-upi">Enable UPI Payments</Label>
                {(!isValidUpiId || !upiName.trim()) && (
                  <Badge variant="destructive" className="ml-2">
                    <Info className="w-3 h-3 mr-1" /> Requires valid UPI ID and Name
                  </Badge>
                )}
              </div>

              {upiEnabled && isValidUpiId && upiName && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold flex items-center">
                    <QrCode className="w-5 h-5 mr-2" />
                    Your UPI QR Code Preview
                  </h3>
                  <p className="text-sm text-gray-600">Scan to test payment</p>

                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-md">
                    {qrCodeUrl && (
                      <>
                        <img
                          src={qrCodeUrl}
                          alt="UPI QR Code"
                          width={200}
                          height={200}
                          className="w-48 h-48 border border-gray-300 rounded"
                          onLoad={() => console.log("QR Code loaded successfully")}
                          onError={(e: any) => {
                            console.error("QR Code failed to load");
                            e.target.style.display = 'none';
                          }}
                        />
                        <p className="mt-3 text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                          {upiId}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Name: {upiName}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="text-center text-xs text-gray-500 mt-2">
                    <p>✓ UPI ID is valid</p>
                    <p>✓ QR code is generated</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {hasExistingSettings && (
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving || (upiEnabled && (!isValidUpiId || !upiName.trim()))}
                  className={`${hasExistingSettings ? 'flex-1' : 'w-full'} bg-orange-500 hover:bg-orange-600`}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Settings
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                <Info className="inline w-3 h-3 mr-1" /> UPI payments are directly deposited to your linked bank account. Verification is manual.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-6 h-6 mr-2" />
            Payment Transaction History
          </CardTitle>
          <CardDescription>
            View all UPI payment transactions and their verification status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentTransactionHistory />
        </CardContent>
      </Card>
    </div>
  )
}

// Payment Transaction History Component
function PaymentTransactionHistory() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const statsResponse = await api.vendors.getDashboardStats()
        if (!statsResponse.success || !statsResponse.vendor?.id) {
          setIsLoading(false)
          return
        }

        const vendorId = statsResponse.vendor.id

        // Fetch orders with UPI payment method
        const response = await api.orders.getVendorOrders({
          status: "all",
          limit: 50
        })

        if (response.orders) {
          // Filter for UPI payments and map to transaction format
          const upiTransactions = response.orders
            .filter((order: any) => order.paymentDetails?.method === "upi")
            .map((order: any) => ({
              id: order.id,
              orderNumber: order.orderNumber || order.id,
              amount: order.pricing?.total || 0,
              status: order.paymentDetails?.status || "pending",
              customerName: order.customer?.name || "Unknown",
              createdAt: order.createdAt,
              verifiedAt: order.paymentDetails?.paymentTimestamp || null,
            }))
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

          setTransactions(upiTransactions)
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error)
        toast({
          title: "Error",
          description: "Failed to load transaction history.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchTransactions()
  }, [toast])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading transactions...</span>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No UPI payment transactions yet.</p>
        <p className="text-sm mt-2">Transactions will appear here once customers make UPI payments.</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      pending_verification: { label: "Pending Verification", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
      failed: { label: "Failed", className: "bg-red-100 text-red-800" },
    }
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" }
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Order #</th>
              <th className="text-left p-2">Customer</th>
              <th className="text-right p-2">Amount</th>
              <th className="text-center p-2">Status</th>
              <th className="text-left p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">#{tx.orderNumber?.slice(-6) || tx.id.slice(-6)}</td>
                <td className="p-2">{tx.customerName}</td>
                <td className="p-2 text-right font-semibold">₹{tx.amount.toFixed(2)}</td>
                <td className="p-2 text-center">{getStatusBadge(tx.status)}</td>
                <td className="p-2 text-gray-600">
                  {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}






