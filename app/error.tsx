"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error Boundary caught:", error)
    }, [error])

    return (
        <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-orange-100">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-orange-600" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
                <p className="text-gray-600 mb-8">
                    We're sorry for the inconvenience. An unexpected error occurred while processing your request.
                </p>

                <div className="space-y-3">
                    <Button
                        onClick={() => reset()}
                        className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg font-semibold"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Try again
                    </Button>

                    <Link href="/" className="block">
                        <Button variant="outline" className="w-full h-12">
                            <Home className="w-4 h-4 mr-2" />
                            Go to Home Page
                        </Button>
                    </Link>
                </div>

                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100 text-left overflow-auto max-h-40">
                    <p className="text-xs font-mono text-red-600 break-words">
                        <strong>Error:</strong> {error.message || "Unknown Runtime Error"}
                    </p>
                    {error.digest && (
                        <p className="text-[10px] font-mono text-red-400 mt-1 uppercase">
                            Digest: {error.digest}
                        </p>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 italic text-[10px] text-gray-400 uppercase tracking-widest">
                    STREET EATS • SYSTEM RECOVERY • {new Date().getFullYear()}
                </div>
            </div>
        </div>
    )
}
