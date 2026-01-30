"use client"

import { useState, useEffect } from "react"
import { Power, PowerOff, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface DashboardHeaderProps {
    shopName?: string
    status?: string
}

export default function DashboardHeader({ shopName = "Dashboard", status = "approved" }: DashboardHeaderProps) {
    const { toast } = useToast()
    const [isActive, setIsActive] = useState(false)
    const [isToggling, setIsToggling] = useState(false)
    const [loading, setLoading] = useState(true)

    // Fetch initial status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await api.vendors.getDashboard()
                if (response?.success && response?.vendor) {
                    setIsActive(response.vendor.isActive || false)
                }
            } catch (error) {
                console.error("Failed to fetch vendor status:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStatus()
    }, [])

    const handleToggle = async () => {
        setIsToggling(true)
        try {
            const response = await api.vendors.toggleStatus()
            if (response.success) {
                setIsActive(response.vendor.isActive)
                toast({
                    title: response.vendor.isActive ? "🟢 You're Online!" : "⚫ You're Offline",
                    description: response.vendor.isActive
                        ? "Your shop is now visible to customers"
                        : "Your shop is hidden from customers",
                })
            }
        } catch (error: any) {
            toast({
                title: "❌ Failed to update status",
                description: error.message || "Please try again",
                variant: "destructive",
            })
        } finally {
            setIsToggling(false)
        }
    }

    if (status === "pending") {
        return null // Don't show toggle for pending vendors
    }

    return (
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white px-4 py-3 sm:px-6 sm:py-4 sticky top-16 z-30 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight">{shopName}</h2>
                        <p className="text-xs sm:text-sm text-orange-100">Manage your shop status</p>
                    </div>
                    <div className="sm:hidden">
                        <h2 className="text-base font-bold">{shopName}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2">
                                {isActive ? (
                                    <Power className="w-4 h-4 sm:w-5 sm:h-5 text-green-300" />
                                ) : (
                                    <PowerOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
                                )}
                                <span className="text-xs sm:text-sm font-semibold hidden sm:inline">
                                    {isActive ? "Online" : "Offline"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 sm:px-3 sm:py-1.5">
                                <span className="text-xs font-medium hidden sm:inline">
                                    {isActive ? "Go Offline" : "Go Online"}
                                </span>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={handleToggle}
                                    disabled={isToggling}
                                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-400"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
