"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { Gift, Send, Users, Star, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

interface GiftOption {
  id: string
  name: string
  description?: string
  price?: number
  pointsCost: number
  image?: string
  vendorName?: string
  tags?: string[]
}

interface GiftHistoryEntry {
  id: string
  type: "food" | "points"
  option: any
  points: number
  status: string
  message?: string
  createdAt: string
  sender: { id?: string; name?: string }
  recipient: { phone?: string; name?: string }
  direction?: "sent" | "received"
}

export default function GiftingPage() {
  const { toast } = useToast()
  const [options, setOptions] = useState<GiftOption[]>([])
  const [history, setHistory] = useState<GiftHistoryEntry[]>([])
  const [availablePoints, setAvailablePoints] = useState<number>(0)
  const [selectedGift, setSelectedGift] = useState<string | null>(null)
  const [recipientPhone, setRecipientPhone] = useState("")
  const [giftMessage, setGiftMessage] = useState("")
  const [pointsToGift, setPointsToGift] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingGift, setSendingGift] = useState(false)
  const [sendingPoints, setSendingPoints] = useState(false)

  const loadData = useCallback(
    async () => {
      try {
        setLoading(true)
        const [optionsResponse, historyResponse, summaryResponse] = await Promise.all([
          api.gifts.getOptions(),
          api.gifts.getHistory(),
          api.rewards.getSummary(),
        ])

        setOptions(optionsResponse.options || [])
        setHistory(historyResponse.history || [])
        setAvailablePoints(summaryResponse.summary.pointsCurrent || 0)
      } catch (error) {
        console.error("Gifting load error", error)
        toast({
          title: "Unable to load gifting",
          description: error instanceof Error ? error.message : "Please try again later",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSendGift = async () => {
    if (!selectedGift || !recipientPhone) {
      toast({
        title: "Missing information",
        description: "Select a gift and provide the recipient's phone number",
        variant: "destructive",
      })
      return
    }

    try {
      setSendingGift(true)
      await api.gifts.sendGift({ optionId: selectedGift, recipientPhone, message: giftMessage || undefined })

      toast({
        title: "Gift sent",
        description: "Your gift voucher has been delivered.",
      })

      setSelectedGift(null)
      setRecipientPhone("")
      setGiftMessage("")

      await loadData()
    } catch (error) {
      console.error("Send gift error", error)
      toast({
        title: "Unable to send gift",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setSendingGift(false)
    }
  }

  const handleSendPoints = async () => {
    const points = Number(pointsToGift)
    if (!points || points <= 0 || !recipientPhone) {
      toast({
        title: "Missing information",
        description: "Enter a valid points amount and recipient phone",
        variant: "destructive",
      })
      return
    }

    if (points > availablePoints) {
      toast({
        title: "Not enough points",
        description: "Reduce the points amount and try again",
        variant: "destructive",
      })
      return
    }

    try {
      setSendingPoints(true)
      await api.gifts.sendPoints({ points, recipientPhone, message: giftMessage || undefined })

      toast({
        title: "Points sent",
        description: `${points} loyalty points have been shared.`,
      })

      setPointsToGift("")
      setRecipientPhone("")
      setGiftMessage("")

      await loadData()
    } catch (error) {
      console.error("Send points error", error)
      toast({
        title: "Unable to send points",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setSendingPoints(false)
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h1 className="mb-2 flex items-center justify-center text-2xl font-bold text-gray-900">
          <Gift className="mr-3 h-7 w-7 text-orange-500" /> Gifting & Sharing
        </h1>
        <p className="text-sm text-gray-600">Share the joy of food with the people you care about.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-8 text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading gifting data…
        </div>
      )}

      <Tabs defaultValue="send-food" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send-food">Send food</TabsTrigger>
          <TabsTrigger value="send-points">Send points</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="send-food" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose a gift</CardTitle>
              <CardDescription>Select a treat to surprise someone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedGift(option.id)}
                    className={`flex w-full cursor-pointer items-center gap-4 rounded-lg border p-4 text-left transition ${selectedGift === option.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-orange-300"
                      }`}
                  >
                    <img
                      src={option.image || "/placeholder.svg"}
                      alt={option.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">{option.name}</h3>
                        <Badge variant="outline" className="border-orange-200 text-orange-700">
                          {option.pointsCost} pts
                        </Badge>
                      </div>
                      {option.description && <p className="text-xs text-gray-600">{option.description}</p>}
                      <p className="text-xs text-gray-500">{option.vendorName ?? "Any vendor"}</p>
                    </div>
                  </button>
                ))}

                {options.length === 0 && !loading && (
                  <p className="text-sm text-gray-500">No gift items are available right now.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recipient details</CardTitle>
              <CardDescription>Enter who should receive this treat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Recipient phone number</label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={recipientPhone}
                  onChange={(event) => setRecipientPhone(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Message (optional)</label>
                <Input
                  placeholder="Hope you enjoy this!"
                  value={giftMessage}
                  onChange={(event) => setGiftMessage(event.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!selectedGift || !recipientPhone || sendingGift}
                onClick={handleSendGift}
              >
                {sendingGift ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send gift
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send-points" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Share loyalty points</CardTitle>
              <CardDescription>Your available balance is {availablePoints} pts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {[100, 250, 500].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setPointsToGift(amount.toString())}
                    className="h-16 flex-col"
                  >
                    <Star className="mb-1 h-5 w-5 text-orange-500" />
                    <span className="font-semibold">{amount}</span>
                    <span className="text-xs">points</span>
                  </Button>
                ))}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Points to send</label>
                <Input
                  type="number"
                  min={0}
                  max={availablePoints}
                  placeholder="Enter points"
                  value={pointsToGift}
                  onChange={(event) => setPointsToGift(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Recipient phone number</label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={recipientPhone}
                  onChange={(event) => setRecipientPhone(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Message (optional)</label>
                <Input
                  placeholder="Enjoy these points!"
                  value={giftMessage}
                  onChange={(event) => setGiftMessage(event.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!pointsToGift || !recipientPhone || sendingPoints}
                onClick={handleSendPoints}
              >
                {sendingPoints ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" /> Send points
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Gift history</h3>
            <p className="text-sm text-gray-600">Track sent and received gifts</p>
          </div>

          {history.length === 0 && !loading && (
            <p className="text-center text-sm text-gray-500">No gifting activity yet. Send your first treat!</p>
          )}

          {history.map((entry) => {
            const isSent = entry.direction === "sent"
            const optionName = entry.option?.name || (entry.type === "points" ? "Points transfer" : "Gift voucher")
            const counterpart = entry.type === "food"
              ? isSent
                ? entry.recipient?.name || entry.recipient?.phone
                : entry.sender?.name || "Someone"
              : isSent
                ? entry.recipient?.phone
                : entry.sender?.name || "Someone"

            return (
              <Card key={entry.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${entry.type === "points" ? "bg-purple-100" : isSent ? "bg-orange-100" : "bg-green-100"}`}>
                      {entry.type === "points" ? <Star className="h-5 w-5 text-purple-600" /> : isSent ? <Send className="h-5 w-5 text-orange-600" /> : <Gift className="h-5 w-5 text-green-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{optionName}</p>
                      <p className="text-xs text-gray-600">
                        {entry.type === "points"
                          ? `${isSent ? "Sent" : "Received"} ${entry.points} pts`
                          : `${isSent ? "To" : "From"}: ${counterpart ?? "Unknown"}`}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge className={entry.status === "redeemed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                    {entry.status}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Invite friends
          </CardTitle>
          <CardDescription>Share Aahar and earn bonus points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 p-4">
            <p className="text-sm text-gray-600">
              Invite friends to Aahar and you both earn 100 bonus points when they place their first order.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-green-500 hover:bg-green-600">
                Share on WhatsApp
              </Button>
              <Button size="sm" variant="outline">
                Copy referral link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
