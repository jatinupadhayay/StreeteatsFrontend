import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { SocketProvider } from "@/contexts/SocketContext"
import { CartProvider } from "@/components/user/CartProvider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Aahar - Authentic Food Delivery",
  description: "Discover and order from the best vendors in your area",
  icons: {
    icon: "/image.png",
  },

}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          storageKey="street-eats-theme"
        >
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                {children}
                <Toaster />
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>

      </body>
    </html>
  )
}