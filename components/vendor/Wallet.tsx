"use client"

import { useState, useEffect } from "react"
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, History, CreditCard, CheckCircle, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Transaction {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  status: "completed" | "pending" | "failed"
  createdAt: string
  orderId?: string
}

interface WithdrawalRequest {
  id: string
  amount: number
  accountNumber: string
  ifscCode: string
  accountHolderName: string
  status: "pending" | "approved" | "rejected" | "processing"
  requestedAt: string
  processedAt?: string
}

export default function Wallet() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
  })

  useEffect(() => {
    fetchWalletData()
  }, [])


  const fetchWalletData = async () => {
    try {
      setIsLoading(true)
      // Fetch wallet balance from vendor dashboard stats
      const statsResponse = await api.vendors.getDashboardStats()
      if (statsResponse.success && statsResponse.todayStats) {
        // Calculate balance from completed orders (this would come from a dedicated wallet endpoint)
        // For now, we'll use today's revenue as a placeholder
        const calculatedBalance = statsResponse.todayStats.revenue || 0
        setBalance(calculatedBalance)
      }

      // Fetch transactions (would come from wallet API)
      // For now, using empty array - this would be replaced with actual API call
      // const transactionsResponse = await api.wallet.getTransactions()
      // setTransactions(transactionsResponse.transactions || [])

      // Fetch withdrawal requests (would come from wallet API)
      // For now, using empty array - this would be replaced with actual API call
      // const withdrawalsResponse = await api.wallet.getWithdrawals()
      // setWithdrawals(withdrawalsResponse.withdrawals || [])

      // Temporary: Set empty arrays until backend wallet endpoints are ready
      setTransactions([])
      setWithdrawals([])
    } catch (error) {
      console.error("Failed to fetch wallet data:", error)
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdrawalRequest = async () => {
    if (!withdrawalForm.amount || !withdrawalForm.accountNumber || !withdrawalForm.ifscCode || !withdrawalForm.accountHolderName) {
      toast({
        title: "Missing information",
        description: "Please fill all fields",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(withdrawalForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (amount > balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      })
      return
    }

    if (withdrawalForm.accountNumber.length < 10) {
      toast({
        title: "Invalid account number",
        description: "Account number must be at least 10 digits",
        variant: "destructive",
      })
      return
    }

    if (withdrawalForm.ifscCode.length !== 11) {
      toast({
        title: "Invalid IFSC code",
        description: "IFSC code must be 11 characters",
        variant: "destructive",
      })
      return
    }

    try {
      // Create withdrawal request via API (when backend endpoint is ready)
      // For now, we'll create it locally and show a message
      const withdrawalData = {
        amount,
        accountNumber: withdrawalForm.accountNumber,
        ifscCode: withdrawalForm.ifscCode.toUpperCase(),
        accountHolderName: withdrawalForm.accountHolderName,
      }

      // TODO: Replace with actual API call when backend endpoint is ready
      // const response = await api.wallet.requestWithdrawal(withdrawalData)
      
      // For now, create locally
      const newWithdrawal: WithdrawalRequest = {
        id: Date.now().toString(),
        amount,
        accountNumber: `****${withdrawalForm.accountNumber.slice(-4)}`,
        ifscCode: withdrawalForm.ifscCode.toUpperCase(),
        accountHolderName: withdrawalForm.accountHolderName,
        status: "pending",
        requestedAt: new Date().toISOString(),
      }

      setWithdrawals([newWithdrawal, ...withdrawals])
      
      // Don't deduct from balance until approved (in real implementation)
      // setBalance(balance - amount)

      // Add transaction record
      const transaction: Transaction = {
        id: Date.now().toString(),
        type: "debit",
        amount,
        description: `Withdrawal request to ${withdrawalForm.accountHolderName}`,
        status: "pending",
        createdAt: new Date().toISOString(),
      }
      setTransactions([transaction, ...transactions])

      // Reset form
      setWithdrawalForm({
        amount: "",
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
      })
      setShowWithdrawalDialog(false)

      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal request has been submitted and is under review",
      })
    } catch (error) {
      console.error("Withdrawal request failed:", error)
      toast({
        title: "Request failed",
        description: "Failed to submit withdrawal request",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
      case "processing":
        return <Clock className="w-4 h-4" />
      case "failed":
      case "rejected":
        return <X className="w-4 h-4" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <WalletIcon className="w-6 h-6" />
              <span>Wallet Balance</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2">₹{balance.toFixed(2)}</div>
          <p className="text-orange-100 text-sm">Available for withdrawal</p>
        </CardContent>
      </Card>

      {/* Withdrawal Button */}
      <div className="flex justify-end">
        <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Request Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Enter your bank account details to withdraw money from your wallet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Available: ₹{balance.toFixed(2)}</p>
              </div>
              <div>
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  type="text"
                  placeholder="Enter account holder name"
                  value={withdrawalForm.accountHolderName}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountHolderName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="Enter account number"
                  value={withdrawalForm.accountNumber}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountNumber: e.target.value.replace(/\D/g, "") })}
                />
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  type="text"
                  placeholder="Enter IFSC code"
                  value={withdrawalForm.ifscCode}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
                  maxLength={11}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowWithdrawalDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleWithdrawalRequest} className="bg-orange-500 hover:bg-orange-600">
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for Transactions and Withdrawals */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawal History</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "credit" ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {transaction.type === "credit" ? (
                            <ArrowUpCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            transaction.type === "credit" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}₹{transaction.amount.toFixed(2)}
                        </p>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Withdrawal Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No withdrawal requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-lg">₹{withdrawal.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{formatDate(withdrawal.requestedAt)}</p>
                        </div>
                        <Badge className={getStatusColor(withdrawal.status)}>
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(withdrawal.status)}
                            <span>{withdrawal.status}</span>
                          </span>
                        </Badge>
                      </div>
                      <div className="mt-3 pt-3 border-t space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Holder:</span>
                          <span className="font-medium">{withdrawal.accountHolderName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Number:</span>
                          <span className="font-medium">{withdrawal.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">IFSC Code:</span>
                          <span className="font-medium">{withdrawal.ifscCode}</span>
                        </div>
                        {withdrawal.processedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Processed At:</span>
                            <span className="font-medium">{formatDate(withdrawal.processedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

