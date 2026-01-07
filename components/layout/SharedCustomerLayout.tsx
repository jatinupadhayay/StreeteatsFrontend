"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MapPin, Store, ShoppingBag, Gift, Star, User as UserIcon } from "lucide-react"

import Navbar from "@/components/common/Navbar"
import CartDrawer from "@/components/user/CartDrawer"
import BottomTabs from "@/components/common/BottomTabs"

interface SharedCustomerLayoutProps {
    children: ReactNode
}

const navigation = [
    { href: "/customer", label: "Home", icon: MapPin },
    { href: "/customer/vendors", label: "Vendors", icon: Store },
    { href: "/customer/orders", label: "Orders", icon: ShoppingBag },
    { href: "/customer/rewards", label: "Rewards", icon: Star },
    { href: "/customer/gifts", label: "Gifts", icon: Gift },
    { href: "/customer/profile", label: "Profile", icon: UserIcon },
]

export default function SharedCustomerLayout({ children }: SharedCustomerLayoutProps) {
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-orange-50">
            <Navbar title="Street Eats" />
            <CartDrawer />

            <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-20 pt-6 md:pb-10">
                <aside className="hidden w-64 shrink-0 rounded-2xl bg-white p-4 shadow-lg md:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                    <nav className="space-y-1">
                        {navigation.map((item) => {
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

                <main className="flex-1 min-w-0 rounded-2xl bg-white p-4 shadow-lg md:p-8 overflow-hidden">
                    {children}
                </main>
            </div>

            <BottomTabs items={navigation} />
        </div>
    )
}
