// components/ui/BottomTab.tsx
"use client"
import Link from "next/link"
import { Home, Search, ShoppingCart, User } from "lucide-react"

export default function BottomTab() {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-md z-50">
      <div className="flex justify-around items-center py-2">
        <Link href="/" className="flex flex-col items-center text-sm text-gray-700">
          <Home className="w-5 h-5 mb-1" /> Home
        </Link>
        <Link href="/explore" className="flex flex-col items-center text-sm text-gray-700">
          <Search className="w-5 h-5 mb-1" /> Explore
        </Link>
        <Link href="/cart" className="flex flex-col items-center text-sm text-gray-700">
          <ShoppingCart className="w-5 h-5 mb-1" /> Cart
        </Link>
        <Link href="/profile" className="flex flex-col items-center text-sm text-gray-700">
          <User className="w-5 h-5 mb-1" /> Profile
        </Link>
      </div>
    </div>
  )
}
