"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, User, LogOut, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import NotificationCenter from "@/components/user/NotificationCenter"

interface NavbarProps {
  title: string
  showNotifications?: boolean
  extraActions?: React.ReactNode
  extraMobileActions?: React.ReactNode
  onProfileClick?: () => void
}

export default function Navbar({
  title,
  showNotifications = true,
  extraActions,
  extraMobileActions,
  onProfileClick
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick()
      setIsMenuOpen(false)
    }
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <img src="/image.png" alt="Aahar Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
              {user ? (
                <p className="text-[10px] text-gray-500 hidden sm:block">Welcome, {user.name}</p>
              ) : (
                <p className="text-[10px] text-gray-500 hidden sm:block">Welcome, Guest</p>
              )}
            </div>
          </div>

          {/* Actions Container */}
          <div className="flex items-center space-x-2">
            {/* Desktop and Mobile Extra Actions (like Wallet) */}
            <div className="flex items-center">
              {extraActions}
            </div>

            {/* Desktop only actions */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  {showNotifications && <NotificationCenter />}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <User className="w-5 h-5 mr-2" />
                        Profile
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onProfileClick}>
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={logout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth">
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/auth?mode=register">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">Register</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions (Notifications) */}
            <div className="md:hidden flex items-center space-x-1">
              {showNotifications && <NotificationCenter />}
              {extraMobileActions}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6 text-orange-600" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overflow */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white animate-in slide-in-from-top duration-200">
            <div className="px-2 pt-2 pb-3 space-y-1 shadow-inner bg-orange-50/30">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                    onClick={handleProfileClick}
                  >
                    <User className="w-5 h-5 mr-3 text-orange-500" />
                    Profile Settings
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-50"
                    onClick={logout}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth" className="block w-full">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LogIn className="w-5 h-5 mr-3 text-orange-500" />
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth?mode=register" className="block w-full">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-orange-600 hover:bg-orange-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <UserPlus className="w-5 h-5 mr-3" />
                      Register Now
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
