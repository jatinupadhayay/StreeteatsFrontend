"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MapPin, Store, ShoppingBag, Gift, Star, User as UserIcon, LogIn } from "lucide-react"

import Navbar from "@/components/common/Navbar"
import CartDrawer from "@/components/user/CartDrawer"
import BottomTabs from "@/components/common/BottomTabs"
import { useAuth } from "@/contexts/AuthContext"

interface SharedCustomerLayoutProps {
    children: ReactNode
}

const navigation = [
    { href: "/customer", label: "Home", icon: MapPin },
    { href: "/customer/vendors", label: "Vendors", icon: Store },
    { href: "/customer/orders", label: "Orders", icon: ShoppingBag },
    { href: "/customer/profile", label: "Profile", icon: UserIcon },
]

export default function SharedCustomerLayout({ children }: SharedCustomerLayoutProps) {
    const pathname = usePathname()
    const { user } = useAuth()

    const filteredNavigation = navigation.filter(item => {
        const restricted = ["/customer/orders", "/customer/rewards", "/customer/gifts", "/customer/profile"]
        if (!user && restricted.includes(item.href)) return false
        return true
    })

    // If guest, maybe add a Login item at the end of mobile tabs if needed, 
    // but Navbar already has it. Let's keep it simple.

    return (
        <div className="min-h-screen bg-orange-50">
            <Navbar title="Street Eats" />
            {pathname.startsWith('/vendor/') && <CartDrawer />}

            <div className="mx-auto flex max-w-7xl gap-0 sm:gap-6 px-1 sm:px-4 pb-20 pt-1 sm:pt-6 md:pb-10">
                <aside className="hidden w-64 shrink-0 rounded-2xl bg-white p-4 shadow-lg md:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                    <nav className="space-y-1">
                        {filteredNavigation.map((item) => {
                            const Icon = item.icon
                            const isActive =
                                pathname === item.href || (item.href !== "/customer" && pathname.startsWith(`${item.href}/`))

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isActive
                                        ? "bg-orange-100 text-orange-600"
                                        : "text-gray-600 hover:bg-orange-50"
                                        }`}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                <main className="flex-1 min-w-0 rounded-xl sm:rounded-2xl bg-white p-1 sm:p-4 shadow-sm sm:shadow-lg md:p-8 overflow-hidden border border-orange-100 sm:border-0">
                    {children}
                </main>
            </div>

            <BottomTabs items={filteredNavigation} />
        </div>
    )
}
