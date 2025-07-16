"use client"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/contexts/SocketContext"

export default function SocketConnectionChecker() {
  const { socket } = useSocket()
  const { toast } = useToast()

  useEffect(() => {
    if (!socket) return

    const listeners = {
      connect: () => toast({
        title: "✅ Socket Connected",
        description: `ID: ${socket.id}`,
      }),
      disconnect: () => toast({
        title: "❌ Socket Disconnected",
        variant: "destructive"
      }),
      connect_error: (err: Error) => toast({
        title: "Connection Error",
        description: err.message,
        variant: "destructive"
      })
    }

    // Set up listeners
    Object.entries(listeners).forEach(([event, handler]) => {
      socket.on(event, handler)
    })

    return () => {
      // Clean up listeners
      Object.entries(listeners).forEach(([event, handler]) => {
        socket.off(event, handler)
      })
    }
  }, [socket])

  return null // This is an invisible component
}