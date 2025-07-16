"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MapPin, ShoppingCart, User } from "lucide-react"
import clsx from "clsx"

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/vendors", label: "Vendors", icon: MapPin },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/profile", label: "Profile", icon: User },
]

export default function BottomTabs() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t shadow z-50 flex justify-around md:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        const Icon = tab.icon

        return (
          <Link key={tab.href} href={tab.href} className="flex-1">
            <div className="flex flex-col items-center justify-center py-2 text-xs">
              <Icon
                className={clsx("w-5 h-5", {
                  "text-orange-600": isActive,
                  "text-gray-500": !isActive,
                })}
              />
              <span
                className={clsx("text-[11px] font-medium", {
                  "text-orange-600": isActive,
                  "text-gray-500": !isActive,
                })}
              >
                {tab.label}
              </span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
