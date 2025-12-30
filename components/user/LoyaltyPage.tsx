"use client"

import { useEffect, useMemo, useState } from "react"

import { Gift, Star, Zap, Crown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

const formatCurrency = (value: number) => value.toFixed(2)

export default function LoyaltyPage() {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [summary, setSummary] = useState<{
    pointsCurrent: number
    pointsTotal: number
    tier: string
    multiplier: number
    nextTier: string
    pointsToNextTier: number
  } | null>(null)
  const [recentRedemptions, setRecentRedemptions] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true)
        const [summaryResponse, catalogResponse] = await Promise.all([
          api.rewards.getSummary(),
          api.rewards.getCatalog(),
        ])

        setSummary(summaryResponse.summary)
        setRecentRedemptions(summaryResponse.recentRedemptions || [])
        setRewards(catalogResponse.rewards || [])
      } catch (error) {
        console.error("Rewards load error", error)
        toast({
          title: "Unable to load rewards",
          description: error instanceof Error ? error.message : "Please try again later",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRewards()
  }, [toast])

  const categories = useMemo(() => {
    const unique = new Set<string>(rewards.map((reward) => reward.category || "Other"))
    return ["All", ...Array.from(unique)]
  }, [rewards])

  const filteredRewards = useMemo(() => {
    if (selectedCategory === "All") return rewards
    return rewards.filter((reward) => (reward.category || "Other") === selectedCategory)
  }, [rewards, selectedCategory])

  const levelProgress = useMemo(() => {
    if (!summary) return 0
    const tierMin: Record<string, number> = {
      bronze: 0,
      silver: 1000,
      gold: 2500,
      platinum: 5000,
    }

    const currentTierMin = tierMin[summary.tier as keyof typeof tierMin] ?? 0
    const nextTierMin = tierMin[summary.nextTier as keyof typeof tierMin] ?? summary.pointsCurrent + summary.pointsToNextTier
    const denom = Math.max(nextTierMin - currentTierMin, 1)
    const progress = ((summary.pointsCurrent - currentTierMin) / denom) * 100
    return Math.min(Math.max(progress, 0), 100)
  }, [summary])

  const handleRedeem = async (rewardId: string) => {
    try {
      setRedeeming(rewardId)
      const response = await api.rewards.redeem(rewardId)
      toast({
        title: "Reward redeemed",
        description: response.message,
      })

      // refresh summary & catalog
      const [summaryResponse, historyResponse] = await Promise.all([
        api.rewards.getSummary(),
        api.rewards.getCatalog(),
      ])

      setSummary(summaryResponse.summary)
      setRecentRedemptions(summaryResponse.recentRedemptions || [])
      setRewards(historyResponse.rewards || [])
    } catch (error) {
      console.error("Redeem error", error)
      toast({
        title: "Unable to redeem",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setRedeeming(null)
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Street Eats Rewards</h1>
        <p className="text-sm text-gray-600">Earn points with every order and unlock amazing rewards.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-10 text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading rewards…
        </div>
      )}

      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5" /> Current points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.pointsCurrent.toLocaleString()}</div>
              <p className="text-xs text-orange-100">Ready to redeem</p>
              <p className="mt-3 text-xs text-orange-100">Lifetime points: {summary.pointsTotal.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="h-5 w-5 text-yellow-500" /> {summary.tier.toUpperCase()} member
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress to {summary.nextTier.toUpperCase()}</span>
                <span>{summary.pointsToNextTier} pts to go</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
              <p className="text-sm text-gray-600">{summary.multiplier}× points multiplier</p>
              <p className="text-xs text-gray-500">Orders placed: {summary.totalOrders ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {recentRedemptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent redemptions</CardTitle>
            <CardDescription>Your latest reward activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRedemptions.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{entry.title}</p>
                  <p className="text-xs text-gray-500">{new Date(entry.redeemedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                    -{entry.pointsSpent} pts
                  </Badge>
                  <Badge className="bg-green-100 text-green-700">{entry.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredRewards.length === 0 && !loading && (
          <p className="text-sm text-gray-500">No rewards available in this category right now.</p>
        )}

        {filteredRewards.map((reward) => {
          const canRedeem = (summary?.pointsCurrent || 0) >= reward.pointsRequired
          const pointsShort = Math.max(reward.pointsRequired - (summary?.pointsCurrent || 0), 0)

          return (
            <Card key={reward.id} className="transition hover:shadow-lg">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={reward.image || "/placeholder.svg"}
                    alt={reward.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        {reward.category || "General"}
                      </Badge>
                      <span className="flex items-center gap-1 font-semibold text-orange-600">
                        <Star className="h-4 w-4" /> {reward.pointsRequired}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{reward.title}</h3>
                      {reward.description && <p className="text-xs text-gray-600">{reward.description}</p>}
                      {reward.vendorName && <p className="text-xs text-gray-500">Valid at {reward.vendorName}</p>}
                    </div>
                  </div>
                </div>

                {reward.expiresAt && (
                  <p className="text-xs text-gray-500">
                    Expires on {new Date(reward.expiresAt).toLocaleDateString()}
                  </p>
                )}

                <Button
                  className="w-full"
                  disabled={!canRedeem || redeeming === reward.id}
                  onClick={() => handleRedeem(reward.id)}
                >
                  {redeeming === reward.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redeeming…
                    </>
                  ) : canRedeem ? (
                    <>
                      <Gift className="mr-2 h-4 w-4" /> Redeem now
                    </>
                  ) : (
                    `Need ${pointsShort} more pts`
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How rewards work</CardTitle>
          <CardDescription>Earn, collect, and redeem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-2xl">
                🍽️
              </div>
              <h3 className="font-semibold">Order food</h3>
              <p className="text-sm text-gray-600">Earn 1 point for every ₹10 spent</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Collect points</h3>
              <p className="text-sm text-gray-600">Multipliers grow with your tier</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">Redeem rewards</h3>
              <p className="text-sm text-gray-600">Unlock free food, discounts, and upgrades</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
