"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { Home, MapPin, ShoppingCart, User } from "lucide-react"
import clsx from "clsx"

type TabItem = {
  href: string
  label: string
  icon: LucideIcon
}

const defaultTabs: TabItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/vendors", label: "Vendors", icon: MapPin },
  { href: "/profile", label: "Profile", icon: User },
]

interface BottomTabsProps {
  items?: TabItem[]
}

export default function BottomTabs({ items }: BottomTabsProps) {
  const pathname = usePathname()
  const tabs = items ?? defaultTabs

  if (tabs.length === 0) {
    return null
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t bg-white shadow md:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        const Icon = tab.icon

        return (
          <Link key={tab.href} href={tab.href} className="flex-1">
            <div className="flex flex-col items-center justify-center py-2 text-xs">
              <Icon
                className={clsx("h-5 w-5", {
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
